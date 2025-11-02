import driver from '../config/database.js';

export const createComments = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

    const session = driver.session();
    try {
        const { id } = req.params;
        const { text } = req.body;
        const r = await session.run(`
            MATCH (u:User {username:$me}), (p:Post {id:$id})
            CREATE (u)-[:ON_POST]->(c:Comment {id:randomUUID(), text:$text, createdAt: datetime()})-[:ON_POST]->(p)
            RETURN c`,
            { me: req.userId, id, text }
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
    finally {
        await session.close();
    }
}

export const getComments = async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: 'No autenticado' });

    const { id } = req.params;
    const session = driver.session();
    try {
        const r = await session.run(`
            MATCH (p:Post {id:$id})<-[:ON_POST]-(c:Comment)<-[:ON_POST]-(u:User)
            RETURN collect({ comment:c{.*}, author:u{name:u.name, username:u.username, isMe: u.username = $me}}) as comments`,
            { me: req.userId, id }
        );
        const rec = r.records[0].get('comments')
        res.json(rec);
    } catch (e) { 
        res.status(400).json({ error: e.message }); 
    }
    finally { 
        await session.close(); 
    }
}