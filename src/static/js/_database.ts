// Imports
import FaunaDB from 'faunadb'
var q = FaunaDB.query

// Constants

const REMOTE_API: string = import.meta.env.SNOWPACK_PUBLIC_REMOTE_API

fetch(REMOTE_API + 'hello').then(result => console.log(result))

// Database Objects
type queryResult = {
  ok: boolean
  response: any | FaunaDB.errors.FaunaError
}

class Reference {
  constructor(
    public collection: string = '',
    public id: string = ''
  ) { }

  static createFrom(faunaRef: FaunaDB.values.Ref): Reference {
    let collection = faunaRef?.collection?.id ?? ''
    return new Reference(collection, faunaRef.id)
  }

  async get() {
  }

  get Ref() {
    return q.Ref(q.Collection(this.collection), this.id)
  }
}

// Database Clients
interface IIndexGetterList {
  [index: string]: {
    (): Promise<any>
  }
}

const IndexGetters: IIndexGetterList = {
  'pages_by_path': async () => {
    return true
  }
}

class Client {
  client!: FaunaDB.Client
  constructor(key: string) {
    if (key === '')
      return
    this.client = new FaunaDB.Client({
      secret: key,
      domain: 'db.fauna.com',
      scheme: 'https'
    })
  }

  /**
   * Wrapper for FaunaDB.Client.query(). Includes safe error handling.
   * To use, check the queryResult.ok boolean first. If true, the query was successful.
   * The result of the query will be found in the queryResult.response object.
   * @param expr FaunaDB expression to evalulate using this particular client.
   */
  public query(expr: FaunaDB.ExprArg): Promise<queryResult> {
    return new Promise((resolve) => {
      // For some reason this function is typed as returning just an object
      this.client.query(expr)
        .then(result => {
          resolve({ ok: true, response: result })
        })
        .catch((err: FaunaDB.errors.FaunaError) => {
          console.warn(err)
          resolve({ ok: false, response: err })
        })
    })
  }

  /** List of pre-assembled database functions. */
  get = {
    /** Returns a Reference object derived from the specified Page path. */
    pageRef: async (path: string): Promise<queryResult> => {
      const result = await this.query(
        q.Paginate(
          q.Match(q.Index('pages_by_path'), path)
        )
      )
      // Return the err object if it failed
      if (result.ok === false)
        return result

      let ref: FaunaDB.values.Ref = result.response.data[0][0]
      return { ok: true, response: Reference.createFrom(ref) }
    }
  };
}

// Init Clients
const FAUNADB_READER_KEY: string = import.meta.env.SNOWPACK_PUBLIC_FAUNADB_READER_KEY
export const Clients = {
  Reader: new Client(FAUNADB_READER_KEY)
}

Clients.Reader.get.pageRef('scp/3685').then(result => console.log(result))
