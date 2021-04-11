/**
 * @file Worker for rendering yaml or for serializing objects to yaml.
 * @author Monkatraz
 */
import { expose } from 'threads/worker'
import { decode } from './_worker_lib'
import yaml from 'js-yaml'

expose({

  parse(buffer: ArrayBuffer) {
    const src = decode(buffer)
    const result = yaml.load(src)
    if (result && typeof result === 'object') return result
    else throw new Error('Invalid yaml source!')
  },

  serialize(obj: PlainObject) {
    return yaml.dump(obj)
  }
})
