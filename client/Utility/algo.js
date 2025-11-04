import bcrypt from 'bcrypt';

const passwordCandidato = '123'

const isValid = await bcrypt.compare(passwordCandidato, '$2b$12$K9te8Mn5t8CywLBTBm8lR.BESbDJD3oqUDzz7TJt16iUUEZ3rBkCW');

console.log(isValid)