import driver from '../config/database.js';
import { hashPassword, comparePassword, sign } from '../utils/helpers.js';

export const register = async (req, res) => {
  const session = driver.session();
  try {
    const { username, name, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await session.run(
      `MATCH (u:User) 
       WHERE u.username = $username OR u.email = $email 
       RETURN u LIMIT 1`,
      { username, email }
    );

    if (existingUser.records.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const result = await session.run(
      `CREATE (u:User {
        name: $name,
        username: $username,
        email: $email,
        password: $hashedPassword,
        createdAt: datetime()
      }) RETURN u`,
      { name, username, email, hashedPassword }
    );

    const user = result.records[0].get('u').properties;
    const token = sign(user.username);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await session.close();
  }
};

export const login = async (req, res) => {
  const session = driver.session();
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const result = await session.run(
      `MATCH (u:User { username: $username }) 
       RETURN u`,
      { username }
    );

    if (result.records.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.records[0].get('u').properties;
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = sign(user.username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    await session.close();
  }
};