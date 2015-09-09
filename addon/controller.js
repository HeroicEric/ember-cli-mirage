import Ember from 'ember';
import Response from './response';
import _isArray from 'lodash/lang/isArray';
import _keys from 'lodash/object/keys';
import shorthandHandlers from 'ember-cli-mirage/shorthands/index';

const {
  isBlank,
  typeOf
} = Ember;

const defaultCodes = {
  get: 200,
  put: 204,
  post: 201,
  'delete': 204
};

export default class Controller {

  constructor(serializer) {
    this.serializerOrRegistry = serializer;
  }

  setSerializerRegistry(registry) {
    this.serializerOrRegistry = registry;
  }

  handle(verb, handler, dbOrSchema, request, customizedCode, options) {
    var code, isEmptyObject;
    var handlerMethod = this._lookupHandlerMethod(verb, handler);
    var response = handlerMethod(handler, dbOrSchema, request, options);

    if (response instanceof Response) {
      return response.toArray();

    } else {
      if (customizedCode) {
        code = customizedCode;
      } else {
        code = defaultCodes[verb];
        isEmptyObject = typeOf(response) === 'object' && _keys(response).length === 0;
        if (code === 204 && response && !isEmptyObject && (_isArray(response) || !isBlank(response))) {
          code = 200;
        }
      }

      if (response) {
        var serializedResponse = this._serialize(response, request);

        return [code, {"Content-Type": "application/json"}, serializedResponse];
      } else {
        return [code, {}, undefined];
      }

    }
  }

  _lookupHandlerMethod(verb, handler) {
    var type = typeof handler;
    type = _isArray(handler) ? 'array' : type;

    var handlerMethod;

    if (type === 'function' || type === 'object') {
      handlerMethod = this['_' + type + 'Handler'];
    } else {
      handlerMethod = shorthandHandlers[verb][type];
    }

    return handlerMethod;
  }

  _functionHandler(handler, dbOrSchema, request) {
    var data;

    try {
      data = handler(dbOrSchema, request);
    } catch(error) {
      console.error('Mirage: Your custom function handler for the url ' + request.url + ' threw an error:', error.message, error.stack);
    }

    return data;
  }

  _objectHandler(object /*, dbOrSchema, request*/) {
    return object;
  }

  _serialize(response, request) {
    return this.serializerOrRegistry.serialize(response, request);
  }

}
