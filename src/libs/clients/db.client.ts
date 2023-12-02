import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../../models/user.model';

dotenv.config()

console.log({
    password: process.env.DB_PASSWORD
})

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  models: [User], 
  logging: false,
});

export default sequelize;
