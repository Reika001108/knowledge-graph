// 1. 引入依赖
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = 3001;

// 配置 Neo4j 连接信息（请替换为本地真实配置）
const NEO4J_URI = 'bolt://localhost:7687';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'neo4jneo4j'; // 替换为你的 Neo4j 密码

// JWT 配置
const JWT_SECRET = 'your_neo4j_knowledge_graph_secret_2026';
const JWT_EXPIRES_IN = '24h';

// 2. 初始化 Neo4j 驱动
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

// 3. 中间件配置
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// 4. 核心工具函数
/**
 * 生成 JWT Token（区分普通用户/管理员）
 */
const generateToken = (userData, role = 'user') => {
  return jwt.sign(
    { 
      userId: userData.id, 
      email: userData.email || '',
      username: userData.username || userData.name,
      role: role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Token 校验中间件（支持角色过滤）
 */
const verifyToken = (req, res, next, requiredRole = null) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供有效的 Token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    // 角色校验
    if (requiredRole && decoded.role !== requiredRole) {
      return res.status(403).json({ error: '无权限访问该接口' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
};

// 5. 基础测试接口
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello 来自 Node.js 后端！' });
});

// 6. 普通用户接口
// 6.1 注册接口
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  let session;
  try {
    session = driver.session();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);
    // 生成新ID（使用时间戳 + 随机数，避免与内部ID混淆）
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    const createdAt = new Date().toISOString();
    const query = `
      CREATE (u:User {
        id: $id,
        username: $username,
        email: $email,
        password: $hashedPassword,
        role: $role,
        status: $status,
        createdAt: $createdAt
      })
      RETURN u { id: id(u), .username, .email, .role, .status, .createdAt } AS user
    `;
    const result = await session.run(query, { id, username, email, hashedPassword, role: 'user', status: 'active', createdAt });
    const createdUser = result.records[0].get('user');
    console.log('🆕 新用户创建:', createdUser.username);
    const token = generateToken(createdUser);
    res.status(201).json({ 
      message: '注册成功！', 
      user: createdUser,
      token: token 
    });
  } catch (error) {
    if (error.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
      if (error.message.includes('username')) {
        return res.status(400).json({ error: '该用户名已被注册，请更换用户名' });
      } else if (error.message.includes('email')) {
        return res.status(400).json({ error: '该邮箱已被注册，请更换邮箱' });
      }
      return res.status(400).json({ error: '该邮箱或用户名已被注册' });
    }
    console.error('数据库错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    if (session) await session.close();
  }
});

// 6.2 普通用户登录接口
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  let session;
  try {
    session = driver.session();
    const query = `MATCH (u:User {email: $email})
    RETURN u {.username, .email, .password, id: id(u)} AS user`;
    const result = await session.run(query, { email });
    if (result.records.length === 0) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const user = result.records[0].get('user');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const token = generateToken(user);
    console.log(token);
    const userResponse = { id: user.id, username: user.username, email: user.email };
    res.status(200).json({ 
      message: '登录成功', 
      user: userResponse,
      token: token 
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});


// 6.4 获取当前用户个人信息
app.get('/api/user/profile', verifyToken, async (req, res) => {
  const userId = req.user.userId; // 从 token 中获取节点内部 ID
  let session;
  try {
    session = driver.session();

    // 查询节点，排除密码字段，同时兼容 User 和 Manager 节点
    const query = `
      MATCH (n)
      WHERE id(n) = $userId
      RETURN n { .username, .email, .createdAt, .name } AS user
    `;
    const result = await session.run(query, { userId: neo4j.int(userId) });

    if (result.records.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const userNode = result.records[0].get('user');
    
    // 处理不同节点类型的字段：User 使用 username，Manager 使用 name
    const username = userNode.username || userNode.name || '';
    const email = userNode.email || '';
    let createdAt = userNode.createdAt;

    // 将 Neo4j 的 DateTime 对象转换为 ISO 字符串
    if (createdAt && typeof createdAt === 'object' && createdAt.toString) {
      createdAt = createdAt.toString();
    }

    res.json({
      code: 200,
      data: {
        username,
        email,
        createdAt
      }
    });
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});

// 6.5 个人中心-修改密码
app.post('/api/user/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId; // 从 token 中获取节点内部 ID

  // 参数校验
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ code: 400, message: '请填写原密码和新密码' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
  }

  let session;
  try {
    session = driver.session();

    // 查询用户节点（兼容 User 和 Manager）
    const query = `
      MATCH (n)
      WHERE id(n) = $userId
      RETURN n { .password, .username, .name } AS user
    `;
    const result = await session.run(query, { userId: neo4j.int(userId) });

    if (result.records.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const userNode = result.records[0].get('user');
    const hashedPassword = userNode.password;

    if (!hashedPassword) {
      return res.status(400).json({ code: 400, message: '该用户未设置密码，请通过其他方式登录' });
    }

    // 验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, hashedPassword);
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: '原密码错误' });
    }

    // 对新密码进行哈希
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密码
    const updateQuery = `
      MATCH (n) WHERE id(n) = $userId
      SET n.password = $newHashedPassword
      RETURN n
    `;
    await session.run(updateQuery, {
      userId: neo4j.int(userId),
      newHashedPassword
    });

    res.json({ code: 200, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});



// 6.6 更新用户个人信息（用户名）
app.put('/api/user/profile', verifyToken, async (req, res) => {
  const { username } = req.body;
  const userId = req.user.userId; // 从 token 中获取节点内部 ID

  // 参数校验
  if (!username || username.trim() === '') {
    return res.status(400).json({ code: 400, message: '用户名不能为空' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ code: 400, message: '用户名长度应为3-20个字符' });
  }

  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) {
    return res.status(400).json({ code: 400, message: '用户名只能包含字母、数字、下划线和中文字符' });
  }

  let session;
  try {
    session = driver.session();

    // 检查用户名是否已被其他用户使用
    const checkQuery = `
      MATCH (u:User)
      WHERE u.username = $username AND id(u) <> $userId
      RETURN u
      LIMIT 1
    `;
    const checkResult = await session.run(checkQuery, { 
      username, 
      userId: neo4j.int(userId) 
    });
    
    if (checkResult.records.length > 0) {
      return res.status(400).json({ code: 400, message: '该用户名已被使用' });
    }

    // 更新用户名
    const updateQuery = `
      MATCH (n) WHERE id(n) = $userId AND n:User
      SET n.username = $username
      RETURN n { .username, .email, .createdAt } AS user
    `;
    const result = await session.run(updateQuery, { 
      userId: neo4j.int(userId), 
      username 
    });

    if (result.records.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const updatedUser = result.records[0].get('user');
    
    // 更新 token 中的用户信息（可选，生成新 token 返回给前端）
    const newToken = generateToken({
      id: userId,
      username: updatedUser.username,
      email: updatedUser.email
    }, 'user');

    res.json({
      code: 200,
      message: '用户名修改成功',
      data: {
        username: updatedUser.username,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt
      },
      token: newToken  // 返回新 token，包含更新后的用户名
    });
  } catch (error) {
    console.error('更新用户名失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});




// ========== 11. 用户反馈接口 ==========

/**
 * 获取当前用户的反馈列表
 * GET /api/feedback/user
 * 需要认证（普通用户/管理员均可）
 */
app.get('/api/feedback/user', verifyToken, async (req, res) => {
  const userId = req.user.userId; // 从 token 中获取节点内部 ID
  let session;
  try {
    session = driver.session();

    // 查询当前用户提交的所有反馈，按创建时间倒序
    // 假设反馈节点通过关系 :SUBMITTED 连接到用户节点
    const query = `
      MATCH (n) WHERE id(n) = $userId
      OPTIONAL MATCH (n)-[:SUBMITTED]->(f:Feedback)
      RETURN f { 
        .*, 
        id: id(f),
        type: coalesce(f.type, 'suggestion'),
        status: coalesce(f.status, 'pending'),
        reply: f.reply,
        createdAt: toString(f.createdAt)
      } AS feedback
      ORDER BY f.createdAt DESC
    `;
    const result = await session.run(query, { userId: neo4j.int(userId) });

    const feedbacks = result.records
      .map(record => record.get('feedback'))
      .filter(f => f !== null); // 过滤掉没有反馈的情况

    res.json({
      code: 200,
      data: feedbacks.map(f => ({
        id: f.id.toString(),
        type: f.type,
        content: f.content,
        contact: f.contact || '',
        status: f.status,
        reply: f.reply || null,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});

// ========== 11. 用户反馈接口 ==========

/**
 * 提交反馈
 * POST /api/feedback
 * 需要认证（普通用户/管理员均可）
 */
app.post('/api/feedback', verifyToken, async (req, res) => {
  const { type, content, contact } = req.body;
  const userId = req.user.userId; // 从 token 中获取节点内部 ID

  // 参数校验
  if (!content) {
    return res.status(400).json({ code: 400, message: '反馈内容不能为空' });
  }
  if (!type) {
    // 如果前端未传 type，默认使用 'suggestion'（兼容前端已移除类型选择的情况）
    type = 'suggestion';
  }

  let session;
  try {
    session = driver.session();

    // 创建 Feedback 节点，并与用户建立 :SUBMITTED 关系
    const query = `
      MATCH (u) WHERE id(u) = $userId
      CREATE (f:Feedback {
        type: $type,
        content: $content,
        contact: $contact,
        status: 'pending',
        createdAt: datetime()
      })
      CREATE (u)-[:SUBMITTED]->(f)
      RETURN f { .*, id: id(f), createdAt: toString(f.createdAt) } AS feedback
    `;

    const result = await session.run(query, {
      userId: neo4j.int(userId),
      type,
      content,
      contact: contact || null
    });

    const created = result.records[0].get('feedback');
    res.json({
      code: 200,
      message: '反馈提交成功',
      data: {
        id: created.id.toString(),
        type: created.type,
        content: created.content,
        contact: created.contact,
        status: created.status,
        createdAt: created.createdAt
      }
    });
  } catch (error) {
    console.error('提交反馈失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});

/**
 * 获取当前用户的反馈列表
 * GET /api/feedback/user
 * 需要认证（普通用户/管理员均可）
 */
app.get('/api/feedback/user', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (n) WHERE id(n) = $userId
      OPTIONAL MATCH (n)-[:SUBMITTED]->(f:Feedback)
      RETURN f { 
        .*, 
        id: id(f),
        type: coalesce(f.type, 'suggestion'),
        status: coalesce(f.status, 'pending'),
        reply: f.reply,
        createdAt: toString(f.createdAt)
      } AS feedback
      ORDER BY f.createdAt DESC
    `;
    const result = await session.run(query, { userId: neo4j.int(userId) });
    const feedbacks = result.records
      .map(record => record.get('feedback'))
      .filter(f => f !== null);
    res.json({
      code: 200,
      data: feedbacks.map(f => ({
        id: f.id.toString(),
        type: f.type,
        content: f.content,
        contact: f.contact || '',
        status: f.status,
        reply: f.reply || null,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ code: 500, message: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});





// 6.3 密码重置接口（仅用于演示，建议通过邮件验证）
app.put('/api/reset-password', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' });
  }

  let session;
  try {
    session = driver.session();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
      MATCH (u:User {email: $email})
      SET u.password = $hashedPassword
      RETURN u.username AS username, u.email AS email
    `;

    const result = await session.run(query, { email, hashedPassword });
    if (result.records.length === 0) {
      return res.status(404).json({ error: '该邮箱未注册，请先注册' });
    }

    res.status(200).json({ 
      message: '密码修改成功！', 
      data: result.records[0].toObject() 
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    if (session) await session.close();
  }
});

// 7. 管理员登录接口
app.post('/api/admin/login', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: '请输入管理员名称和密码' });
  }

  let session;
  try {
    session = driver.session();

    // 查询指定名称的 Manager 节点
    const query = `
      MATCH (m:Manager {name: $name})
      RETURN m {.name, .password, id: id(m)} AS manager
    `;
    const result = await session.run(query, { name });

    if (result.records.length === 0) {
      return res.status(401).json({ error: '管理员名称或密码错误' });
    }

    const manager = result.records[0].get('manager');
    const isPasswordValid = await bcrypt.compare(password, manager.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '管理员名称或密码错误' });
    }

    const token = generateToken(manager, 'admin');
      // 打印Token
    console.log('🔑 管理员登录生成的Token:', token);
    console.log('👤 管理员信息:', {
    managerId: manager.id,
    name: manager.name,
    role: 'admin'
  });

    const managerResponse = {
      id: manager.id,
      name: manager.name,
      role: 'admin'
    };

    
    res.status(200).json({
      message: '管理员登录成功',
      user: managerResponse,
      token: token
    });

  } catch (error) {
    console.error('❌ 管理员登录异常:', error);
    res.status(500).json({ error: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});

// 7.1 管理员仪表盘统计接口（增强版，返回节点/关系分类统计）
app.get('/api/admin/dashboard/stats', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  let session;
  try {
    session = driver.session();

    // 1. 统计用户数量（User 标签节点数）
    const userResult = await session.run('MATCH (u:User) RETURN count(u) AS userCount');
    const userCount = userResult.records[0].get('userCount').toNumber();

    // 2. 统计知识节点数量（所有非 User 且非 Manager 的节点）
    const nodeResult = await session.run(
      'MATCH (n) WHERE NOT n:User AND NOT n:Manager AND NOT n:Feedback RETURN count(n) AS nodeCount'
    );
    const nodeCount = nodeResult.records[0].get('nodeCount').toNumber();

    // 3. 统计关系数量（所有关系）
    const relationResult = await session.run('MATCH ()-[r]->() RETURN count(r) AS relationCount');
    const relationCount = relationResult.records[0].get('relationCount').toNumber();

    // 4. 节点类型分布：按标签分组统计数量（排除 User 和 Manager）
    const categoryResult = await session.run(`
      MATCH (n)
      WHERE NOT n:User AND NOT n:Manager
      RETURN labels(n)[0] AS category, count(n) AS count
    `);
    const categoryCounts = categoryResult.records.map(record => ({
      name: record.get('category'),
      count: record.get('count').toNumber()
    }));

    // 5. 关系类型分布：按关系类型分组统计数量
    const relationTypeResult = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
    `);
    const relationTypeCounts = relationTypeResult.records.map(record => ({
      name: record.get('type'),
      count: record.get('count').toNumber()
    }));

    res.json({
      success: true,
      data: {
        userCount,
        nodeCount,
        edgeCount: relationCount,       // 前端 Stats.vue 中使用 edgeCount
        categoryCounts,
        relationTypeCounts
      }
    });

  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  } finally {
    if (session) await session.close();
  }
});

// 7.2 管理员专属后台接口（示例）
app.get('/api/admin/home', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  res.json({
    message: '欢迎访问管理员后台',
    user: req.user,
    data: {
      userCount: 0,
      managerCount: 1
    }
  });
});

// 8. Neo4j 数据查询接口（需登录）知识图谱
app.get('/api/query', (req, res, next) => verifyToken(req, res, next), async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (n)-[r]->(m) WHERE NOT (n:User OR m:User OR n:Manager OR m:Manager OR n:Feedback OR m:Feedback) RETURN n,r,m');
    const nodes = [];
    const links = [];
    const nodeIds = new Set();
    result.records.forEach((record) => {
      // 处理起点
      const startNode = record.get('n');
      const startId = startNode.identity.toString();
      if (!nodeIds.has(startId)) {
        nodeIds.add(startId);
        nodes.push({
          id: startId,
          name: startNode.properties.name || startNode.properties.title || "未知节点",
          label: startNode.labels[0] || "Entity",
          properties: startNode.properties,
        });
      }
      // 处理终点
      const endNode = record.get('m');
      const endId = endNode.identity.toString();
      if (!nodeIds.has(endId)) {
        nodeIds.add(endId);
        nodes.push({
          id: endId,
          name: endNode.properties.name || endNode.properties.title || "未知节点",
          label: endNode.labels[0] || "Entity",
          properties: endNode.properties,
        });
      }
      // 处理关系
      const relation = record.get('r');
      links.push({
        source: startId,
        target: endId,
        type: relation.type,
        properties: relation.properties,
      });
    });
    res.json({
      success: true,
      data: { nodes, links }
    });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ error: '数据库查询出错' });
  } finally {
    await session.close();
  }
});


//查询节点（搜索）
app.post('/api/search', async (req, res) => {
  const { keyword, entityType, relationType, mode } = req.body;
  console.log(req.body);
  const session = driver.session();

  try {
    let cypher = '';
    const params = {};

    if (mode === 'keyword') {
      // 关键词搜索：排除 User 和 Feedback 节点
      cypher = `
        MATCH (n) 
        WHERE toLower(n.name) CONTAINS $keyword 
        AND NOT (n:User OR n:Feedback OR n:Manager)
        OPTIONAL MATCH (n)-[r]-(m)
        WHERE NOT (m:User OR m:Feedback OR n:Manager)
        RETURN n, r, m
      `;
      params.keyword = keyword.toLowerCase();
    } 
    else if (mode === 'filter') {
      // 筛选搜索：根据选中的实体类型或关系类型查询
      if (entityType) {
        // 排除 User 和 Feedback 类型的实体
        if (entityType === 'User' || entityType === 'Feedback' || entityType === 'Manager') {
          return res.json({ nodes: [], edges: [] });
        }
        
        cypher = `
          MATCH (n:${entityType})-[r]-(m:${entityType})
          WHERE NOT (n:User OR n:Feedback OR n:Manager)
          AND NOT (m:User OR m:Feedback OR m:Manager)
          RETURN DISTINCT n, r, m
          UNION
          MATCH (n:${entityType})
          WHERE NOT (n)--() 
          AND NOT (n:User OR n:Feedback OR n:Manager)
          RETURN DISTINCT n, null AS r, null AS m
        `;
      } 
      else if (relationType) {
        // 关系类型：排除连接 User 或 Feedback 节点的关系
        cypher = `
          MATCH (n)-[r:${relationType}]->(m)
          WHERE NOT (n:User OR n:Feedback OR m:Manager) 
          AND NOT (m:User OR m:Feedback OR m:Manager)
          RETURN n, r, m
        `;
      } else {
        return res.json({ nodes: [], edges: [] });
      }
    } 
    else {
      return res.status(400).json({ error: '无效的 mode' });
    }

    const result = await session.run(cypher, params);

    const nodesMap = new Map();
    const edges = [];

    result.records.forEach(record => {
      const n = record.get('n');
      const r = record.get('r');
      const m = record.get('m');

      // 添加节点 n
      if (n && !nodesMap.has(n.identity.toString())) {
        const labels = n.labels || [];
        nodesMap.set(n.identity.toString(), {
          id: n.identity.toString(),
          label: n.properties.name,
          type: n.properties.description || n.properties.type || labels[0] || '未知',
        });
      }
      
      // 添加节点 m（如果存在）
      if (m && !nodesMap.has(m.identity.toString())) {
        const labels = m.labels || [];
        nodesMap.set(m.identity.toString(), {
          id: m.identity.toString(),
          label: m.properties.name,
          type: m.properties.description || m.properties.type || labels[0] || '未知',
        });
      }
      
      // 添加边（如果存在关系）
      if (r) {
        edges.push({
          from: r.start.toString(),
          to: r.end.toString(),
          label: r.properties?.type || '关联',
        });
      }
    });

    res.json({
      nodes: Array.from(nodesMap.values()),
      edges: edges,
    });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  } finally {
    await session.close();
  }
});










// 9. DeepSeek 聊天接口（需登录）
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 模拟回答数据
const mockAnswers = [
  {
    keywords: ['neo4j', '图数据库'],
    answer: 'Neo4j 是目前最流行的原生图数据库，由 Neo4j, Inc. 开发。它使用图模型（节点、关系、属性）来存储和处理数据，查询语言为 Cypher。',
    sources: ['Neo4j 官方网站']
  },
  {
    keywords: ['cypher', '查询语言'],
    answer: 'Cypher 是 Neo4j 的声明式图查询语言，类似于 SQL 但专为图数据设计。语法示例：MATCH (p:Person)-[:KNOWS]->(f:Friend) RETURN p, f。',
    sources: ['Neo4j Cypher Manual']
  }
];

// 模拟回答函数
function getMockAnswer(question) {
  const lowerQ = question.toLowerCase();
  for (let item of mockAnswers) {
    if (item.keywords.some(keyword => lowerQ.includes(keyword))) {
      return { answer: item.answer, sources: item.sources };
    }
  }
  return { answer: `关于“${question}”暂无相关信息`, sources: [] };
}

// 调用 DeepSeek API
async function getDeepSeekAnswer(question) {
  if (!DEEPSEEK_API_KEY) {
    console.log('未配置 DEEPSEEK_API_KEY，使用模拟回答');
    return getMockAnswer(question);
  }

  try {
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是知识图谱专家，简洁准确回答问题' },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    };

    const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return { answer: response.data.choices[0].message.content, sources: [] };
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.message);
    return getMockAnswer(question);
  }
}

// 聊天接口（直接输出，没有打字效果）
app.post('/api/chat', (req, res, next) => verifyToken(req, res, next), async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: '缺少有效的 question 字段' });
  }

  try {
    const result = await getDeepSeekAnswer(question);
    res.json({ answer: result.answer, sources: result.sources });
  } catch (error) {
    console.error('处理聊天请求出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ========== 新增：流式聊天接口（支持打字机效果） ==========

/**
 * 流式聊天接口 - 支持SSE逐字返回
 * 前端可通过EventSource或fetch流式读取
 */
app.post('/api/chat/stream', (req, res, next) => verifyToken(req, res, next), async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: '缺少有效的 question 字段' });
  }

  // 检查API密钥
  if (!DEEPSEEK_API_KEY) {
    console.log('未配置 DEEPSEEK_API_KEY，使用模拟回答（流式版）');
    
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // 获取模拟回答
    const mockResult = getMockAnswer(question);
    const mockAnswer = mockResult.answer;
    
    // 模拟逐字输出（每50ms输出一个字符）
    let index = 0;
    const interval = setInterval(() => {
      if (index < mockAnswer.length) {
        const char = mockAnswer[index];
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: char,
          done: false 
        })}\n\n`);
        index++;
      } else {
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ 
          type: 'done', 
          content: mockAnswer,
          done: true 
        })}\n\n`);
        res.end();
      }
    }, 50); // 每50ms输出一个字符，可调整速度
    
    return;
  }

  try {
    // 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用Nginx缓冲

    // 构建请求体，启用流式输出
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是知识图谱专家，简洁准确回答问题' },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true // 关键：启用流式输出
    };

    // 使用axios发送流式请求
    const response = await axios({
      method: 'post',
      url: DEEPSEEK_API_URL,
      data: requestBody,
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream', // 重要：以流的形式接收响应
      timeout: 60000 // 延长超时时间
    });

    let fullResponse = '';
    let buffer = '';

    // 处理DeepSeek返回的流式数据
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          // 跳过[DONE]标记
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            
            if (content) {
              fullResponse += content;
              
              // 将内容块发送给前端
              res.write(`data: ${JSON.stringify({ 
                type: 'chunk', 
                content: content,
                done: false 
              })}\n\n`);
            }
          } catch (e) {
            console.error('解析流数据失败:', e);
          }
        }
      }
    });

    // 流式响应结束
    response.data.on('end', () => {
      console.log('流式响应完成');
      res.write(`data: ${JSON.stringify({ 
        type: 'done', 
        content: fullResponse,
        done: true 
      })}\n\n`);
      res.end();
    });

    // 处理错误
    response.data.on('error', (error) => {
      console.error('流式响应错误:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        content: '服务暂时不可用',
        done: true 
      })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('DeepSeek API 流式调用失败:', error);
    
    // 尝试使用模拟回答作为降级
    const mockResult = getMockAnswer(question);
    const mockAnswer = mockResult.answer;
    
    // 模拟逐字输出
    let index = 0;
    const interval = setInterval(() => {
      if (index < mockAnswer.length) {
        const char = mockAnswer[index];
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: char,
          done: false 
        })}\n\n`);
        index++;
      } else {
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ 
          type: 'done', 
          content: mockAnswer,
          done: true 
        })}\n\n`);
        res.end();
      }
    }, 50);
  }
});


// 10. 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    api: 'DeepSeek', 
    configured: !!DEEPSEEK_API_KEY,
    neo4j: 'connected' 
  });
});



// ========== 知识图谱增删改查接口（管理员权限） ==========
// 注意：以下接口与之前已有的 /api/node/add 等并存，但建议统一使用 /api/admin/nodes 系列

// 1. 按节点名称查询（增强版，支持关系类型和实体类型过滤）
app.get('/api/query/node', verifyToken, async (req, res) => {
  const { keyword, relationTypes, entityTypes } = req.query;
  if (!keyword) return res.status(400).json({ error: '关键词不能为空' });

  const relationTypeList = relationTypes 
    ? (Array.isArray(relationTypes) ? relationTypes : [relationTypes]) 
    : [];
  const entityTypeList = entityTypes 
    ? (Array.isArray(entityTypes) ? entityTypes : [entityTypes]) 
    : [];

  let session;
  try {
    session = driver.session();

    let matchClause = 'MATCH (n)-[r]->(m)';
    let whereClause = 'WHERE n.name CONTAINS $keyword OR m.name CONTAINS $keyword';
    const params = { keyword };

    if (relationTypeList.length > 0) {
      whereClause += ' AND type(r) IN $relationTypes';
      params.relationTypes = relationTypeList;
    }

    if (entityTypeList.length > 0) {
      whereClause += ' AND any(label IN labels(n) WHERE label IN $entityTypes)';
      whereClause += ' AND any(label IN labels(m) WHERE label IN $entityTypes)';
      params.entityTypes = entityTypeList;
    }

    const query = `${matchClause} ${whereClause} RETURN n, r, m`;
    const result = await session.run(query, params);

    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    result.records.forEach((record) => {
      const startNode = record.get('n');
      const startId = startNode.identity.toString();
      if (!nodeIds.has(startId)) {
        nodeIds.add(startId);
        nodes.push({
          id: startId,
          name: startNode.properties.name || '未知',
          label: startNode.labels[0] || 'Entity',
          properties: startNode.properties,
        });
      }

      const endNode = record.get('m');
      const endId = endNode.identity.toString();
      if (!nodeIds.has(endId)) {
        nodeIds.add(endId);
        nodes.push({
          id: endId,
          name: endNode.properties.name || '未知',
          label: endNode.labels[0] || 'Entity',
          properties: endNode.properties,
        });
      }

      const relation = record.get('r');
      links.push({
        source: startId,
        target: endId,
        type: relation.type,
        properties: relation.properties,
      });
    });

    res.json({ success: true, data: { nodes, links } });
  } catch (error) {
    console.error('查询节点失败:', error);
    res.status(500).json({ error: '查询失败' });
  } finally {
    if (session) await session.close();
  }
});

// 2. 添加节点（需要管理员权限）- 旧版接口，保留兼容
app.post('/api/node/add', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { name, label = 'Entity' } = req.body;
  if (!name) return res.status(400).json({ error: '节点名称不能为空' });

  let session;
  try {
    session = driver.session();
    const query = `
      CREATE (n:${label} {name: $name, createdAt: datetime()})
      RETURN n {.name, label: labels(n)[0], id: id(n)} AS node
    `;
    const result = await session.run(query, { name });
    const node = result.records[0].get('node');
    res.json({ success: true, message: '节点添加成功', data: node });
  } catch (error) {
    console.error('添加节点失败:', error);
    res.status(500).json({ error: '添加失败' });
  } finally {
    if (session) await session.close();
  }
});

// 3. 添加关系（需要管理员权限）- 旧版接口，保留兼容
app.post('/api/relation/add', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { startNodeId, endNodeId, type = 'RELATES_TO' } = req.body;
  if (!startNodeId || !endNodeId) return res.status(400).json({ error: '起点/终点ID不能为空' });

  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (a),(b) WHERE id(a) = $startNodeId AND id(b) = $endNodeId
      CREATE (a)-[r:${type} {createdAt: datetime()}]->(b)
      RETURN type(r) AS type, id(r) AS relationId
    `;
    const result = await session.run(query, { 
      startNodeId: neo4j.int(startNodeId), 
      endNodeId: neo4j.int(endNodeId) 
    });
    const relation = result.records[0].toObject();
    res.json({ success: true, message: '关系添加成功', data: relation });
  } catch (error) {
    console.error('添加关系失败:', error);
    res.status(500).json({ error: '添加失败' });
  } finally {
    if (session) await session.close();
  }
});

// 4. 删除节点（需要管理员权限）- 旧版接口，保留兼容
app.delete('/api/node/delete/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: '节点ID不能为空' });

  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (n) WHERE id(n) = $id
      DETACH DELETE n
      RETURN count(n) AS deletedCount
    `;
    const result = await session.run(query, { id: neo4j.int(id) });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    if (deletedCount === 0) return res.status(404).json({ error: '节点不存在' });
    res.json({ success: true, message: '节点删除成功', data: { deletedCount } });
  } catch (error) {
    console.error('删除节点失败:', error);
    res.status(500).json({ error: '删除失败' });
  } finally {
    if (session) await session.close();
  }
});

// 5. 修改节点（需要管理员权限）- 旧版接口，保留兼容
app.put('/api/node/update/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  const { name, label } = req.body;
  if (!name && !label) return res.status(400).json({ error: '至少修改名称或标签' });

  let session;
  try {
    session = driver.session();

    let setClauses = [];
    const params = { id: neo4j.int(id) };
    if (name) {
      setClauses.push('n.name = $name');
      params.name = name;
    }

    if (label) {
      const before = await session.run('MATCH (n) WHERE id(n)=$id RETURN labels(n) AS oldLabels', { id: neo4j.int(id) });
      const oldLabels = before.records[0].get('oldLabels');
      const removeLabels = oldLabels.map(l => 'n:`' + l + '`').join(', ');
      const updateQuery = `
        MATCH (n) WHERE id(n) = $id
        REMOVE ${removeLabels}
        SET n:${label}
        ${setClauses.length ? 'SET ' + setClauses.join(', ') : ''}
        RETURN n {.name, label: labels(n)[0], id: id(n)} AS node
      `;
      const result = await session.run(updateQuery, params);
      const node = result.records[0].get('node');
      return res.json({ success: true, message: '节点修改成功', data: node });
    } else {
      const updateQuery = `
        MATCH (n) WHERE id(n) = $id
        SET ${setClauses.join(', ')}
        RETURN n {.name, label: labels(n)[0], id: id(n)} AS node
      `;
      const result = await session.run(updateQuery, params);
      const node = result.records[0].get('node');
      res.json({ success: true, message: '节点修改成功', data: node });
    }
  } catch (error) {
    console.error('修改节点失败:', error);
    res.status(500).json({ error: '修改失败' });
  } finally {
    if (session) await session.close();
  }
});

// ========== 新增：节点管理统一接口（适配前端 NodeManage.vue） ==========
// 6. 获取所有节点（管理员权限，排除 User、Manager 和 Feedback）
app.get('/api/admin/nodes', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  let session;
  try {
    session = driver.session();
    // 查询所有非 User、Manager 且非 Feedback 的节点
    const query = `
      MATCH (n)
      WHERE NOT n:User AND NOT n:Manager AND NOT n:Feedback
      RETURN n {
        id:id(n),
        name: n.name,
        label: labels(n)[0],
        description: n.description
      } AS node
      ORDER BY n.id
    `;
    const result = await session.run(query);
    const nodes = result.records.map(record => {
      const node = record.get('node');
      return {
        id: node.id.toString(),
        name: node.name || '',
        label: node.label || 'Entity',
        description: node.description || ''
      };
    });
    res.json({ success: true, data: nodes });
  } catch (error) {
    console.error('获取节点列表失败:', error);
    res.status(500).json({ success: false, error: '获取节点列表失败' });
  } finally {
    if (session) await session.close();
  }
});

// 7. 创建节点（管理员权限）
app.post('/api/admin/nodes', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { name, label = 'Entity', properties = {} } = req.body;
  if (!name) return res.status(400).json({ error: '节点名称不能为空' });

  let session;
  try {
    session = driver.session();
    
    // 检查节点名称是否已存在
    const checkQuery = `
      MATCH (n) WHERE n.name = $name
      RETURN n
      LIMIT 1
    `;
    const checkResult = await session.run(checkQuery, { name });
    if (checkResult.records.length > 0) {
      return res.status(400).json({ error: '节点名称已存在' });
    }
    
    const nodeProps = { 
      name, 
      description: properties.description || '',
      type: label,
      view_num:0
    };
    const query = `
      CREATE (n:${label} $props)
      RETURN n {
        id: id(n),
        name: n.name,
        label: labels(n)[0],
        description: n.description
      } AS node
    `;
    const result = await session.run(query, { props: nodeProps });
    const node = result.records[0].get('node');
    res.json({
      success: true,
      message: '节点创建成功',
      data: {
        id: node.id.toString(),
        name: node.name,
        label: node.label,
        description: node.description
      }
    });
  } catch (error) {
    console.error('创建节点失败:', error);
    res.status(500).json({ error: '创建失败' });
  } finally {
    if (session) await session.close();
  }
});

// 8. 更新节点（管理员权限）
app.put('/api/admin/nodes/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  const { name, label, properties = {} } = req.body;
  
  if (!name && !label && !properties) {
    return res.status(400).json({ error: '至少提供一项更新内容' });
  }

  let session;
  try {
    session = driver.session();

    // 获取当前节点信息
    const fetchQuery = `
      MATCH (n) WHERE id(n) = $id 
      RETURN n, labels(n) AS oldLabels
    `;
    const fetchResult = await session.run(fetchQuery, { id: neo4j.int(id) });
    if (fetchResult.records.length === 0) {
      return res.status(404).json({ error: '节点不存在' });
    }
    const currentNode = fetchResult.records[0].get('n');
    const oldLabels = fetchResult.records[0].get('oldLabels');

    // 如果修改名称，检查新名称是否已被其他节点使用
    if (name && name !== currentNode.properties.name) {
      const nameCheckQuery = `
        MATCH (n) WHERE n.name = $name AND id(n) <> $id
        RETURN n
        LIMIT 1
      `;
      const nameCheckResult = await session.run(nameCheckQuery, { name, id: neo4j.int(id) });
      if (nameCheckResult.records.length > 0) {
        return res.status(400).json({ error: '节点名称已存在' });
      }
    }

    // 构建更新属性
    const setProps = {};
    if (name !== undefined) setProps.name = name;
    if (properties.description !== undefined) setProps.description = properties.description;

    // 处理标签更新
    let labelUpdate = '';
    if (label) {
      const safeLabel = label.replace(/[^a-zA-Z0-9_]/g, '');
      const removeLabels = oldLabels.map(l => 'n:`' + l.replace(/`/g, '``') + '`').join(', ');
      labelUpdate = `REMOVE ${removeLabels} SET n:${safeLabel}`;
    }

    // 动态 SET 子句
    const setEntries = Object.entries(setProps).map(([k, v]) => `n.${k} = $props.${k}`);
    const setClause = setEntries.length ? 'SET ' + setEntries.join(', ') : '';

    const updateQuery = `
      MATCH (n) WHERE id(n) = $id
      ${labelUpdate}
      ${setClause}
      RETURN n {
        id: id(n),
        name: n.name,
        label: labels(n)[0],
        description: n.description
      } AS node
    `;

    const result = await session.run(updateQuery, {
      id: neo4j.int(id),
      props: setProps
    });

    const node = result.records[0].get('node');
    res.json({
      success: true,
      message: '节点更新成功',
      data: {
        id: node.id.toString(),
        name: node.name,
        label: node.label,
        description: node.description
      }
    });
  } catch (error) {
    console.error('更新节点失败:', error);
    res.status(500).json({ error: '更新失败' });
  } finally {
    if (session) await session.close();
  }
});

// 9. 删除节点（管理员权限）- 通过名称删除
app.delete('/api/admin/nodes/:name', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { name } = req.params;
  if (!name) return res.status(400).json({ error: '节点名称不能为空' });

  let session;
  try {
    session = driver.session();
    
    // 先检查节点是否存在
    const checkQuery = `
      MATCH (n) WHERE n.name = $name
      RETURN n, id(n) AS nodeId
      LIMIT 1
    `;
    const checkResult = await session.run(checkQuery, { name });
    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: '节点不存在' });
    }
    
    const nodeId = checkResult.records[0].get('nodeId');
    
    // 检查节点是否存在关系
    const relationQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      OPTIONAL MATCH (n)-[r1]-()
      OPTIONAL MATCH ()-[r2]-(n)
      WITH n, COLLECT(DISTINCT r1) + COLLECT(DISTINCT r2) AS relations
      WHERE size(relations) > 0
      RETURN relations
    `;
    const relationResult = await session.run(relationQuery, { nodeId });
    
    if (relationResult.records.length > 0) {
      const relations = relationResult.records[0].get('relations');
      const relationCount = relations.length;
      return res.status(400).json({ 
        error: `无法删除节点"${name}"，该节点存在 ${relationCount} 个关系，请先删除相关关系后再尝试删除节点` 
      });
    }
    
    // 删除节点
    const deleteQuery = `
      MATCH (n) WHERE id(n) = $nodeId
      DELETE n
      RETURN count(n) AS deletedCount
    `;
    const deleteResult = await session.run(deleteQuery, { nodeId });
    const deletedCount = deleteResult.records[0].get('deletedCount').toNumber();
    
    if (deletedCount === 0) {
      return res.status(404).json({ error: '节点不存在' });
    }
    
    res.json({ 
      success: true, 
      message: `节点"${name}"删除成功` 
    });
  } catch (error) {
    console.error('删除节点失败:', error);
    res.status(500).json({ error: '删除失败' });
  } finally {
    if (session) await session.close();
  }
});

// 可选：获取节点关系列表（用于调试或前端提示）
app.get('/api/admin/nodes/:name/relations', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { name } = req.params;
  
  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (n) WHERE n.name = $name
      OPTIONAL MATCH (n)-[r]-(related)
      RETURN collect(DISTINCT {
        type: type(r),
        targetName: related.name,
        targetLabel: labels(related)[0]
      }) AS relations
    `;
    const result = await session.run(query, { name });
    const relations = result.records[0].get('relations');
    
    res.json({ 
      success: true, 
      data: relations 
    });
  } catch (error) {
    console.error('获取节点关系失败:', error);
    res.status(500).json({ error: '获取节点关系失败' });
  } finally {
    if (session) await session.close();
  }
});




// ========== 新增：关系管理接口（适配前端 RelationManage.vue） ==========

// 10. 获取所有关系（管理员权限，排除 User 和 Manager 相关的关系）
app.get('/api/admin/relations', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (a)-[r]->(b)
      WHERE NOT a:User AND NOT a:Manager AND NOT b:User AND NOT b:Manager AND NOT a:Feedback AND NOT b:Feedback
      RETURN {
        id: id(r),
        source: id(a),
        target: id(b),
        type: r.type,
        properties: r.description
      } AS relation
      ORDER BY id(r)
    `;
    const result = await session.run(query);
    const relations = result.records.map(record => {
      const rel = record.get('relation');
      return {
        id: rel.id.toString(),
        source: rel.source.toString(),
        target: rel.target.toString(),
        type: rel.type,
        description: rel.properties || ''
      };
    });
    // console.log(relations);
    res.json({ success: true, data: relations });
  } catch (error) {
    console.error('获取关系列表失败:', error);
    res.status(500).json({ success: false, error: '获取关系列表失败' });
  } finally {
    if (session) await session.close();
  }
});

// 11. 创建关系（管理员权限）
app.post('/api/admin/relations', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { source, target, type, name, description } = req.body;

  // 验证必填字段
  if (!source || !target || !type) {
    return res.status(400).json({ error: '源节点、目标节点和关系类型不能为空' });
  }

  // 限制关系类型长度
  if (type.length > 100) {
    return res.status(400).json({ error: '关系类型长度不能超过100个字符' });
  }

  let session;
  try {
    session = driver.session();

    // 检查节点是否存在且不是系统节点
    const checkNodesQuery = `
      MATCH (a), (b) WHERE id(a) = $source AND id(b) = $target
      RETURN a, b
    `;
    const checkResult = await session.run(checkNodesQuery, {
      source: neo4j.int(source),
      target: neo4j.int(target)
    });
    
    if (checkResult.records.length === 0) {
      return res.status(404).json({ error: '源节点或目标节点不存在' });
    }
    
    const record = checkResult.records[0];
    const startNode = record.get('a');
    const endNode = record.get('b');
    
    // 检查是否为系统节点
    if (startNode.labels.includes('User') || startNode.labels.includes('Manager') ||
        endNode.labels.includes('User') || endNode.labels.includes('Manager')) {
      return res.status(403).json({ error: '不能为系统节点创建关系' });
    }

    // 检查是否已存在相同的关系（只要源节点和目标节点相同就判断为重复）
    const checkRelationQuery = `
      MATCH (a)-[r]->(b) 
      WHERE id(a) = $source AND id(b) = $target
      RETURN r, type(r) as relationType
      LIMIT 1
    `;
    const relationCheck = await session.run(checkRelationQuery, {
      source: neo4j.int(source),
      target: neo4j.int(target)
    });
    
    if (relationCheck.records.length > 0) {
      const existingRel = relationCheck.records[0];
      const existingType = existingRel.get('relationType');
      return res.status(409).json({ 
        error: '关系已存在',
        message: `源节点和目标节点之间已存在关系"${existingType}"，不能重复添加`
      });
    }

    // 构建属性对象（包含name和description）
    const properties = {};
    if (name && name.trim()) {
      properties.name = name.trim();
    } else {
      properties.name = type; // 如果没有提供name，使用type作为默认值
    }
    if (description && description.trim()) {
      properties.description = description.trim();
      properties.type = type;
    }

    // 创建关系
    const createQuery = `
      MATCH (a), (b) 
      WHERE id(a) = $source AND id(b) = $target
      CREATE (a)-[r:${type}]->(b)
      SET r = $props
      RETURN {
        id: id(r),
        source: id(startNode(r)),
        target: id(endNode(r)),
        type: type(r),
        properties: properties(r)
      } AS relation
    `;
    
    const result = await session.run(createQuery, {
      source: neo4j.int(source),
      target: neo4j.int(target),
      props: properties
    });
    
    const rel = result.records[0].get('relation');
    res.json({
      success: true,
      message: '关系创建成功',
      data: {
        id: rel.id.toString(),
        source: rel.source.toString(),
        target: rel.target.toString(),
        type: rel.type,
        properties: rel.properties,
        name: rel.properties?.name || '',
        description: rel.properties?.description || ''
      }
    });
  } catch (error) {
    console.error('创建关系失败:', error);
    res.status(500).json({ error: '创建失败: ' + error.message });
  } finally {
    if (session) await session.close();
  }
});

// 12. 更新关系（管理员权限）- 仅更新属性，类型不可变
app.put('/api/admin/relations/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  // 验证至少提供了描述字段
  if (description === undefined) {
    return res.status(400).json({ error: '请提供描述字段进行更新' });
  }

  let session;
  try {
    session = driver.session();

    // 检查关系是否存在且不属于系统节点
    const fetchQuery = `
      MATCH (a)-[r]->(b) WHERE id(r) = $id
      RETURN r, a, b
    `;
    const fetchResult = await session.run(fetchQuery, { id: neo4j.int(id) });
    if (fetchResult.records.length === 0) {
      return res.status(404).json({ error: '关系不存在' });
    }
    const record = fetchResult.records[0];
    const startNode = record.get('a');
    const endNode = record.get('b');
    
    // 检查是否涉及系统节点
    if (startNode.labels.includes('User') || startNode.labels.includes('Manager') ||
        endNode.labels.includes('User') || endNode.labels.includes('Manager')) {
      return res.status(403).json({ error: '不能修改系统节点间的关系' });
    }

    // 获取当前关系属性
    const currentRelation = record.get('r');
    const currentProperties = currentRelation.properties || {};
    
    // 更新或删除描述字段
    let updatedProperties;
    if (description && description.trim() !== '') {
      // 有描述内容：更新description字段
      updatedProperties = {
        ...currentProperties,
        description: description.trim()
      };
    } else {
      // 描述为空：删除description字段
      updatedProperties = { ...currentProperties };
      delete updatedProperties.description;
    }

    // 更新关系属性
    const updateQuery = `
      MATCH ()-[r]->() WHERE id(r) = $id
      SET r = $props
      RETURN {
        id: id(r),
        source: id(startNode(r)),
        target: id(endNode(r)),
        type: type(r),
        properties: properties(r)
      } AS relation
    `;
    const result = await session.run(updateQuery, {
      id: neo4j.int(id),
      props: updatedProperties
    });
    
    const rel = result.records[0].get('relation');
    res.json({
      success: true,
      message: description ? '关系描述更新成功' : '关系描述已清除',
      data: {
        id: rel.id.toString(),
        source: rel.source.toString(),
        target: rel.target.toString(),
        type: rel.type,
        properties: rel.properties,
        description: rel.properties?.description || ''
      }
    });
  } catch (error) {
    console.error('更新关系描述失败:', error);
    res.status(500).json({ error: '更新失败: ' + error.message });
  } finally {
    if (session) await session.close();
  }
});

// 13. 删除关系（管理员权限）
app.delete('/api/admin/relations/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: '关系ID不能为空' });

  let session;
  try {
    session = driver.session();

    // 可选：检查关系是否涉及系统节点，防止误删
    const checkQuery = `
      MATCH (a)-[r]->(b) WHERE id(r) = $id
      RETURN a, b
    `;
    const checkResult = await session.run(checkQuery, { id: neo4j.int(id) });
    if (checkResult.records.length > 0) {
      const startNode = checkResult.records[0].get('a');
      const endNode = checkResult.records[0].get('b');
      if (startNode.labels.includes('User') || startNode.labels.includes('Manager') ||
          endNode.labels.includes('User') || endNode.labels.includes('Manager')) {
        return res.status(403).json({ error: '不能删除系统节点间的关系' });
      }
    }

    const query = `
      MATCH ()-[r]->() WHERE id(r) = $id
      DELETE r
      RETURN count(r) AS deletedCount
    `;
    const result = await session.run(query, { id: neo4j.int(id) });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    if (deletedCount === 0) return res.status(404).json({ error: '关系不存在' });
    res.json({ success: true, message: '关系删除成功' });
  } catch (error) {
    console.error('删除关系失败:', error);
    res.status(500).json({ error: '删除失败' });
  } finally {
    if (session) await session.close();
  }
});


// ========== 新增：用户管理接口（适配前端 UserManage.vue） ==========

/**
 * 获取所有用户（管理员权限）
 * GET /api/admin/users
 */
app.get('/api/admin/users', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (u:User)
      RETURN u {
        .id, .username, .email, .role, .status, .createdAt,
        id: id(u)
      } AS user
      ORDER BY u.createdAt DESC
    `;
    const result = await session.run(query);
    const users = result.records.map(record => {
      const user = record.get('user');
      return {
        id: user.id.toString(),          // 转换为字符串，与前端一致
        username: user.username,
        email: user.email,
        role: user.role || 'user',       // 默认普通用户
        status: user.status || 'active', // 默认启用
        createdAt: user.createdAt
      };
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  } finally {
    if (session) await session.close();
  }
});

/**
 * 创建用户（管理员权限）
 * POST /api/admin/users
 */
app.post('/api/admin/users', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { username, email, password, role = 'user', status = 'active' } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: '用户名、邮箱和密码为必填项' });
  }

  let session;
  try {
    session = driver.session();

    // 检查用户名或邮箱是否已存在
    const checkQuery = `
      MATCH (u:User) WHERE u.username = $username OR u.email = $email
      RETURN u
    `;
    const checkResult = await session.run(checkQuery, { username, email });
    if (checkResult.records.length > 0) {
      return res.status(400).json({ success: false, error: '用户名或邮箱已存在' });
    }

    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 生成新ID（使用时间戳 + 随机数，避免与内部ID混淆）
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    const createdAt = new Date().toISOString();

    const createQuery = `
      CREATE (u:User {
        id: $id,
        username: $username,
        email: $email,
        password: $hashedPassword,
        role: $role,
        status: $status,
        createdAt: $createdAt
      })
      RETURN u { .id, .username, .email, .role, .status, .createdAt } AS user
    `;
    const result = await session.run(createQuery, {
      id,
      username,
      email,
      hashedPassword,
      role,
      status,
      createdAt
    });

    const newUser = result.records[0].get('user');
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  } finally {
    if (session) await session.close();
  }
});

/**
 * 更新用户（管理员权限）
 * PUT /api/admin/users/:id
 */
app.put('/api/admin/users/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  console.log('收到的ID:', id);
  console.log('ID类型:', typeof id);
  const { username, email, role, status} = req.body;

  if (!username && !email && !role && !status) {
    return res.status(400).json({ success: false, error: '至少提供一个更新字段' });
  }

  let session;
  try {
    session = driver.session();

    // 检查用户是否存在
    const userExists = await session.run(
      'MATCH (u:User) where id(u)=toInteger($id) RETURN u',
      { id }
    );
    console.log(userExists);
    if (userExists.records.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    // 构建 SET 子句
    const setFields = [];
    const params = { id };

    if (username) {
      setFields.push('u.username = $username');
      params.username = username;
    }
    if (email) {
      setFields.push('u.email = $email');
      params.email = email;
    }
    if (role) {
      setFields.push('u.role = $role');
      params.role = role;
    }
    if (status) {
      setFields.push('u.status = $status');
      params.status = status;
    }
    // if (password) {
    //   const salt = await bcrypt.genSalt(10);
    //   const hashedPassword = await bcrypt.hash(password, salt);
    //   setFields.push('u.password = $hashedPassword');
    //   params.hashedPassword = hashedPassword;
    // }

    const updateQuery = `
      MATCH (u:User) where id(u)=toInteger($id)
      SET ${setFields.join(', ')}
      RETURN u { .id, .username, .email, .role, .status, .createdAt } AS user
    `;
    const result = await session.run(updateQuery, params);
    const updatedUser = result.records[0].get('user');
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  } finally {
    if (session) await session.close();
  }
});

/**
 * 更新用户状态（启用/禁用）- 独立接口，方便前端调用
 * PATCH /api/admin/users/:id/status
 */
app.patch('/api/admin/users/:id/status', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, error: '状态值必须是 active 或 inactive' });
  }

  let session;
  try {
    session = driver.session();
    const query = `
      MATCH (u:User) where id(u)=toInteger($id)
      SET u.status = $status
      RETURN u { .id, .username, .email, .role, .status, .createdAt } AS user
    `;
    const result = await session.run(query, { id, status });
    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    const updatedUser = result.records[0].get('user');
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  } finally {
    if (session) await session.close();
  }
});

/**
 * 删除用户（管理员权限）
 * DELETE /api/admin/users/:id
 */
app.delete('/api/admin/users/:id', (req, res, next) => verifyToken(req, res, next, 'admin'), async (req, res) => {
  const { id } = req.params;
  let session;
  try {
    session = driver.session();

    // 先删除用户节点及其所有关系（如果有）
    const query = `
      MATCH (u:User) where id(u)=toInteger($id)
      DETACH DELETE u
      RETURN count(u) AS deletedCount
    `;
    const result = await session.run(query, { id });
    const deletedCount = result.records[0].get('deletedCount').toNumber();
    if (deletedCount === 0) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  } finally {
    if (session) await session.close();
  }
});



// ========== 管理员反馈管理接口 ==========

/**
 * 获取所有用户反馈（管理员权限）
 * GET /api/admin/feedbacks
 */
app.get('/api/admin/feedbacks', verifyToken, async (req, res) => {
  // 确保是管理员
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限访问' });
  }

  let session;
  try {
    session = driver.session();

    // 查询所有反馈节点，并关联提交者信息（用户名、邮箱）
    const query = `
      MATCH (u)-[:SUBMITTED]->(f:Feedback)
      RETURN {
        id: id(f),
        username: u.username,
        email: u.email,
        type: coalesce(f.type, 'suggestion'),
        content: f.content,
        contact: f.contact,
        status: coalesce(f.status, 'pending'),
        reply: f.reply,
        createdAt: toString(f.createdAt)
      } AS feedback
      ORDER BY f.createdAt DESC
    `;
    const result = await session.run(query);
    
    const feedbacks = result.records.map(record => record.get('feedback'));
    
    res.json({
      success: true,
      data: feedbacks.map(fb => ({
        id: fb.id.toString(),
        username: fb.username || fb.email?.split('@')[0] || '未知用户',
        type: fb.type,
        content: fb.content,
        contact: fb.contact || '',
        status: fb.status,
        reply: fb.reply || null,
        createdAt: fb.createdAt
      }))
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});

/**
 * 更新反馈（回复、修改状态）
 * PUT /api/admin/feedbacks/:id
 * 请求体：{ reply, status }
 */
app.put('/api/admin/feedbacks/:id', verifyToken, async (req, res) => {
  // 确保是管理员
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '无权限访问' });
  }

  const { id } = req.params;
  const { reply, status } = req.body;
  
  if (!reply && !status) {
    return res.status(400).json({ success: false, error: '至少提供回复内容或状态' });
  }

  let session;
  try {
    session = driver.session();

    // 构建动态 SET 语句
    const setClauses = [];
    const params = { id: neo4j.int(id) };
    if (reply !== undefined) {
      setClauses.push('f.reply = $reply');
      params.reply = reply;
    }
    if (status !== undefined) {
      setClauses.push('f.status = $status');
      params.status = status;
    }

    const query = `
      MATCH (f:Feedback) WHERE id(f) = $id
      SET ${setClauses.join(', ')}
      RETURN f { .*, id: id(f), createdAt: toString(f.createdAt) } AS feedback
    `;

    const result = await session.run(query, params);
    if (result.records.length === 0) {
      return res.status(404).json({ success: false, error: '反馈不存在' });
    }

    const updated = result.records[0].get('feedback');
    res.json({
      success: true,
      message: '更新成功',
      data: {
        id: updated.id.toString(),
        reply: updated.reply,
        status: updated.status
      }
    });
  } catch (error) {
    console.error('更新反馈失败:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  } finally {
    if (session) await session.close();
  }
});

// 14. 启动服务器（原编号，保持位置不变）
async function startServer() {
  try {
    await driver.verifyConnectivity();
    console.log('✅ 已成功连接到 Neo4j 数据库');

    app.listen(PORT, () => {
      console.log(`🚀 Node.js 服务器已启动: http://localhost:${PORT}`);
      console.log(`👉 测试接口: http://localhost:${PORT}/api/hello`);
      console.log(`👉 管理员登录接口: http://localhost:${PORT}/api/admin/login`);
      console.log(`👉 管理员仪表盘统计接口: http://localhost:${PORT}/api/admin/dashboard/stats`);
      console.log(`👉 节点管理接口: http://localhost:${PORT}/api/admin/nodes`);
      console.log(`👉 关系管理接口: http://localhost:${PORT}/api/admin/relations`);
      console.log(`👉 Token 有效期: ${JWT_EXPIRES_IN}`);
    });

  } catch (err) {
    console.error('❌ 连接 Neo4j 失败:', err);
    console.error('请检查 Neo4j 是否启动，以及用户名密码是否正确');
    process.exit(1);
  }
}

startServer();

// 进程退出时关闭 Neo4j 驱动
process.on('exit', async () => {
  await driver.close();
  console.log('🔌 Neo4j 驱动已关闭');
});