import { MongoMemoryServer } from 'mongodb-memory-server-core'
import mongoose, { Connection } from 'mongoose'

import config from '../config/config'
import { createLoggerWithLabel } from '../config/logger'

const logger = createLoggerWithLabel(module)

export default async (): Promise<Connection> => {
  const usingMockedDb = !config.db.uri
  // Mock out the database if we're developing locally
  if (usingMockedDb) {
    logger.warn({
      message:
        '!!! WARNING !!!\nNo database configuration detected\nUsing mock development database instead.\nThis should NEVER be seen in production.',
      meta: {
        action: 'init',
      },
    })

    if (!process.env.MONGO_BINARY_VERSION) {
      logger.error({
        message: 'Environment var MONGO_BINARY_VERSION is missing',
        meta: {
          action: 'init',
        },
      })
      process.exit(1)
    }

    const mongod = new MongoMemoryServer({
      binary: { version: String(process.env.MONGO_BINARY_VERSION) },
      instance: {
        port: 3000,
        ip: '127.0.0.1',
        dbName: 'formsg',
      },
    })

    await mongod.start()
    // Store the uri to connect to later on
    config.db.uri = mongod.getUri()
  }

  // Actually connect to the database
  function connect() {
    return mongoose.connect(config.db.uri, config.db.options)
  }

  // Only required for initial connection errors, reconnect on error.
  try {
    await connect()
  } catch (err) {
    logger.error({
      message: '@MongoDB: Error caught while connecting',
      meta: {
        action: 'init',
      },
      error: err,
    })
    await connect()
  }

  mongoose.connection.on('error', (err) => {
    // No need to reconnect here since mongo config has auto reconnect, we log.
    logger.error({
      message: '@MongoDB: DB connection error',
      meta: {
        action: 'init',
      },
      error: err,
    })
  })

  mongoose.connection.on('open', function () {
    logger.info({
      message: '@MongoDB: DB connected',
      meta: {
        action: 'init',
      },
    })
  })

  mongoose.connection.on('close', function (str) {
    logger.info({
      message: `@MongoDB: DB disconnected: ${str}`,
      meta: {
        action: 'init',
      },
    })
  })

  // Inspect cluster topology from client
  const client = mongoose.connection.getClient()
  const {
    description: { servers, type },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } = client.topology

  if (
    type === 'ReplicaSetWithPrimary' &&
    ![...servers.values()].some(
      ({ type }: { type: string }) => type === 'RSSecondary',
    )
  ) {
    // There are no secondary nodes in ReplicaSetWithPrimary cluster.
    // Queries with `secondary` read preferences will fail, so rewrite
    // those to be `secondaryPreferred`.
    logger.warn({
      message:
        'ReplicaSetWithPrimary cluster has no secondary nodes. ' +
        'Forcing secondary read preference to secondaryPreferred.',
      meta: {
        action: 'schema',
      },
    })
    Object.values(mongoose.models).forEach((model) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (model.schema.get('read')?.mode === 'secondary') {
        model.schema.set('read', 'secondaryPreferred')
      }
    })
  }

  // Seed db with initial agency if we have none
  if (
    process.env.INIT_AGENCY_DOMAIN &&
    process.env.INIT_AGENCY_SHORTNAME &&
    process.env.INIT_AGENCY_FULLNAME
  ) {
    const Agency = mongoose.model('Agency')
    const agencyCount = await Agency.count()
    if (agencyCount === 0) {
      await mongoose.connection.collection(Agency.collection.name).updateOne(
        { shortName: process.env.INIT_AGENCY_SHORTNAME },
        {
          $setOnInsert: {
            shortName: process.env.INIT_AGENCY_SHORTNAME,
            fullName: process.env.INIT_AGENCY_FULLNAME,
            emailDomain: [process.env.INIT_AGENCY_DOMAIN],
            logo: '/logo192.png',
          },
        },
        { upsert: true },
      )
    }
  }

  // Seed the db with govtech agency if using the mocked db
  if (usingMockedDb) {
    const Agency = mongoose.model('Agency')
    const agencyList = [
      {
        shortName: 'govtech',
        fullName: 'Government Technology Agency',
        emailDomain: 'data.gov.sg',
        logo: '/public/modules/core/img/govtech.jpg',
      },
      {
        shortName: 'was',
        fullName: 'Work Allocation Singapore',
        emailDomain: 'was.gov.sg',
        logo: '/public/modules/core/img/was.jpg',
      },
    ]
    await Agency.create(agencyList)
  }

  return mongoose.connection
}
