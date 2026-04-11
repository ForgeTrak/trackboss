import mysql, { Pool } from 'mysql2/promise';
import logger from '../logger';
import { getConnectionObject } from '../util/environmentWrapper';

const DEFAULT_CONN_LIMIT = 10;
const DEFAULT_QUEUE_LIMIT = 0;

// Singleton database connection pool
let pool: Pool | undefined;

const dbConnection = {
    username: '',
    password: '',
    host: '',
    dbname: '',
};

export async function initConfig() {
    const connectionObject = await getConnectionObject();
    const { host, username, password, dbname } = connectionObject;
    const { MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DB } = process.env;
    if (MYSQL_HOST || MYSQL_USER || MYSQL_PASS || MYSQL_DB) {
        logger.warn('pool - database connection info found in both env vars and secrets manager. Environment variables will take precedence.');
    } else if (connectionObject) {
        logger.info('pool - database connection info pulled from secrets manager');
    }
    dbConnection.username = MYSQL_USER || username || '';
    dbConnection.password = MYSQL_PASS || password || '';
    dbConnection.host = MYSQL_HOST || host || '';
    dbConnection.dbname = MYSQL_DB || dbname || '';
}

(async () => {
    await initConfig();
})();

export function getPool(): Pool {
    if (!pool) {
        // Gotta build it

        // BUT FIRST: check that all the required vars are present and accounted
        // for - otherwise the server will seem to run fine... until a DB query
        // is attempted at who knows when and it crashes

        Object.keys(dbConnection).forEach((requiredEnvVar) => {
            if (!requiredEnvVar) {
                logger.error(`pool - Fatal: error in database connection env vars. ${requiredEnvVar} missing!  Check config`);
                throw new Error('Terminating server');
            }
        });

        // These env vars are optional, so use defaults if they're not present
        // or not numbers
        const connectionLimit = Number(process.env.MYSQL_CONN_LIMIT) || DEFAULT_CONN_LIMIT;
        const queueLimit = Number(process.env.MYSQL_QUEUE_LIMIT) || DEFAULT_QUEUE_LIMIT;

        pool = mysql.createPool({
            host: dbConnection.host,
            user: dbConnection.username,
            password: dbConnection.password,
            database: dbConnection.dbname,
            waitForConnections: true,
            timezone: '+00:00',
            connectionLimit,
            queueLimit,
        });
        // eslint-disable-next-line max-len
        logger.info(`pool - connected to ${dbConnection.dbname} on ${dbConnection.host} with a connection limit of ${connectionLimit}`);
    }
    return pool;
}

export async function destroyPool() {
    if (pool) {
        await pool.end();
        pool = undefined;
    }
}
