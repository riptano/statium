import React, { useContext } from 'react';
import loGet from 'lodash.get';
import loSet from 'lodash.set';
import loHas from 'lodash.has';
import loClone from 'lodash.clone';
import upperFirst from 'lodash.upperfirst';
import _defer from 'lodash.defer';

function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(source, true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(source).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  }
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var error = function error(msg) {
  if (process.env.NODE_ENV === 'production') {
    console.error(msg);
  } else {
    throw new Error(msg);
  }
};

var defaultGet = function defaultGet(key) {
  error("Failed to retrieve a value for key \"".concat(key, "\", no ViewModel found"));
};

var defaultSet = function defaultSet(key, value) {
  error("Failed to set key \"".concat(key, "\", no ViewModel found. Value: ").concat(JSON.stringify(value)));
};

var defaultDispatch = function defaultDispatch(event) {
  for (var _len = arguments.length, payload = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    payload[_key - 1] = arguments[_key];
  }

  error("Cannot find handler for event \"".concat(event, "\". Event arguments: ").concat(JSON.stringify(payload)));
};

var rootViewModel = {
  formulas: {},
  data: {},
  state: {},
  store: {},
  $get: defaultGet,
  $set: defaultSet,
  $retrieve: function $retrieve(key) {
    return rootViewModel.$get(key);
  },
  $dispatch: defaultDispatch
};
var rootViewController = {
  $get: rootViewModel.$retrieve,
  $set: rootViewModel.$set,
  $dispatch: defaultDispatch
};
var ViewModelContext = React.createContext({
  vm: rootViewModel
});
var ViewControllerContext = React.createContext(rootViewController);

var idCounter = 0;
var getId = function getId(prefix) {
  return "".concat(prefix, "-").concat(++idCounter);
};
var chain = function chain(proto) {
  for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  return Object.assign.apply(Object, [Object.create(proto)].concat(sources));
};
var setterNameForKey = function setterNameForKey(key) {
  return "set".concat(upperFirst(key));
};
var getKeys = function getKeys(object) {
  return [].concat(Object.getOwnPropertySymbols(object), Object.getOwnPropertyNames(object));
};
var getKeyPrefix = function getKeyPrefix(key) {
  return _typeof(key) === 'symbol' ? key : String(key).split('.').shift();
};
var validKey = function validKey(key) {
  return typeof key === 'string' && key !== '' || _typeof(key) === 'symbol';
};
var findOwner = function findOwner(object, entityName, key) {
  var depth = 0;

  for (var owner = object; owner; owner = owner.parent) {
    var entity = owner[entityName];

    if (_typeof(entity) === 'object' && entity.hasOwnProperty(key)) {
      return [owner, depth];
    }

    depth++;
  }

  return [null];
};

var normalizeProtectedKey = function normalizeProtectedKey(entry) {
  if (entry && _typeof(entry) === 'object' && !Array.isArray(entry)) {
    if (!('key' in entry)) {
      throw new Error("Invalid protected key entry: ".concat(JSON.stringify(entry)));
    }

    var key = entry.key,
        event = entry.event;

    if (!validKey(key)) {
      throw new Error("Invalid protected key: ".concat(JSON.stringify(key)));
    }

    if (_typeof(key) === 'symbol' && !validKey(event)) {
      throw new Error("Protected key ".concat(String(key), " requires event name."));
    }

    if (!validKey(event)) {
      throw new Error("Invalid event name for protected key \"".concat(String(key), "\": ").concat(JSON.stringify(event)));
    }

    return [key, event || setterNameForKey(key)];
  } else if (validKey(entry)) {
    if (_typeof(entry) === 'symbol') {
      throw new Error("Protected key ".concat(String(entry), " requires event name."));
    }

    return [entry, setterNameForKey(entry)];
  }

  throw new Error("Invalid protected key: ".concat(JSON.stringify(entry)));
};

var normalizeProtectedKeys = function normalizeProtectedKeys(keys) {
  var validatedKeys;

  if (validKey(keys)) {
    var _normalizeProtectedKe = normalizeProtectedKey(keys),
        _normalizeProtectedKe2 = _slicedToArray(_normalizeProtectedKe, 2),
        key = _normalizeProtectedKe2[0],
        event = _normalizeProtectedKe2[1];

    validatedKeys = _defineProperty({}, key, event);
  } else if (keys && _typeof(keys) === 'object') {
    if (Array.isArray(keys)) {
      validatedKeys = keys.reduce(function (acc, entry) {
        var _normalizeProtectedKe3 = normalizeProtectedKey(entry),
            _normalizeProtectedKe4 = _slicedToArray(_normalizeProtectedKe3, 2),
            key = _normalizeProtectedKe4[0],
            event = _normalizeProtectedKe4[1];

        acc[key] = event;
        return acc;
      }, {});
    } else {
      validatedKeys = {};
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = getKeys(keys)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _key2 = _step.value;
          var _event = keys[_key2];

          var _normalizeProtectedKe5 = normalizeProtectedKey({
            key: _key2,
            event: _event
          }),
              _normalizeProtectedKe6 = _slicedToArray(_normalizeProtectedKe5, 2),
              validatedKey = _normalizeProtectedKe6[0],
              validatedEvent = _normalizeProtectedKe6[1];

          validatedKeys[validatedKey] = validatedEvent;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  } else {
    throw new Error("Invalid protected keys: ".concat(JSON.stringify(keys)));
  }

  return validatedKeys;
};

var normalizeBindings = function normalizeBindings() {
  var bindings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!bindings || !(_typeof(bindings) === 'object' || validKey(bindings))) {
    throw new Error("Invalid bindings: ".concat(JSON.stringify(bindings)));
  }

  if (validKey(bindings)) {
    bindings = [bindings];
  }

  if (Array.isArray(bindings)) {
    bindings = bindings.reduce(function (map, propName) {
      if (validKey(propName)) {
        map[propName] = propName;
      } else if (Array.isArray(propName)) {
        var _propName = _slicedToArray(propName, 2),
            key = _propName[0],
            _propName$ = _propName[1],
            publish = _propName$ === void 0 ? false : _propName$; // prop name is the same as key in this case


        map[key] = {
          key: key,
          publish: publish
        };
      } else if (_typeof(propName) === 'object') {
        var prop = propName.prop,
            _key = propName.key,
            _propName$publish = propName.publish,
            _publish = _propName$publish === void 0 ? false : _propName$publish,
            rest = _objectWithoutProperties(propName, ["prop", "key", "publish"]);

        if (!validKey(_key)) {
          throw new Error("The 'key' field is required for a binding: " + JSON.stringify(propName));
        }

        prop = validKey(prop) ? prop : _key;
        map[prop] = _objectSpread2({}, rest, {
          key: _key,
          publish: _publish
        });
      }

      return map;
    }, {});
  }

  return getKeys(bindings).map(function (propName) {
    var binding = bindings[propName];

    if (validKey(binding)) {
      return {
        propName: propName,
        key: binding,
        publish: false
      };
    } else if (typeof binding === 'function') {
      return {
        propName: propName,
        key: propName,
        formula: binding
      };
    } else if (_typeof(binding) === 'object') {
      var key = binding.key,
          publish = binding.publish,
          formula = binding.formula,
          setterName = binding.setterName;

      if (formula && typeof formula !== 'function') {
        throw new Error("Invalid formula definition: ".concat(JSON.stringify(formula)));
      }

      if ('publish' in binding && typeof publish !== 'boolean') {
        throw new Error("Invalid publish value: ".concat(JSON.stringify(publish), ". Should be 'true' or 'false'."));
      }

      if (publish && _typeof(key) === 'symbol' && !setterName) {
        throw new Error("Setter function name is required for publishing Symbol " + "keys in a ViewModel. Published key: " + String(key));
      }

      return _objectSpread2({
        propName: propName,
        key: key || propName,
        publish: publish
      }, publish ? {
        setterName: setterName || setterNameForKey(propName)
      } : {}, {}, formula ? {
        formula: formula
      } : {});
    } else {
      // TODO Better error handling
      throw new Error('Invalid bound prop definition');
    }
  });
};
var mapProps = function mapProps(vm, bindings) {
  return bindings.reduce(function (out, binding) {
    var propName = binding.propName,
        key = binding.key,
        formula = binding.formula,
        publish = binding.publish,
        setterName = binding.setterName;
    out[propName] = formula ? formula(vm.$retrieve) : vm.$retrieve(key);

    if (publish) {
      out[setterName] = vm.getKeySetter(vm, key);
    }

    return out;
  }, {});
};
var mapPropsToArray = function mapPropsToArray(vm, bindings) {
  return bindings.map(function (binding) {
    var key = binding.key,
        formula = binding.formula,
        publish = binding.publish;
    var value = formula ? formula(vm.$retrieve) : vm.$retrieve(key);

    if (!publish) {
      return value;
    }

    var setter = vm.getKeySetter(vm, key);
    return [value, setter];
  });
};

var accessorType = Symbol('accessorType');

var retrieve = function retrieve(vm, key) {
  return vm.formulas[key] ? vm.formulas[key](vm.$retrieve) : vm.$get(key);
};

var getter = function getter(vm, key) {
  return loGet(vm.store, key);
};

var getStateKeyOwner = function getStateKeyOwner(vm, key) {
  var prefix = getKeyPrefix(key);

  var _findOwner = findOwner(vm, 'state', prefix),
      _findOwner2 = _slicedToArray(_findOwner, 2),
      owner = _findOwner2[0],
      depth = _findOwner2[1]; // If no owner was found, the key does not exist up the prototype chain.
  // This means we can't set it.


  if (owner === null) {
    throw new Error("Cannot find owner ViewModel for key ".concat(key, ". You need to provide ") + "initial value for this key in \"initialState\" prop.");
  }

  return [owner, depth];
};

var setter = function setter(vm, key, value) {
  var _getStateKeyOwner = getStateKeyOwner(vm, key),
      _getStateKeyOwner2 = _slicedToArray(_getStateKeyOwner, 1),
      owner = _getStateKeyOwner2[0];

  if (owner.protectedKeys && key in owner.protectedKeys) {
    var event = owner.protectedKeys[key];
    owner.$dispatch(event, value);
  } else {
    owner.setState(_defineProperty({}, key, value));
  }
};

var multiGet = function multiGet(vm, keys) {
  var objectSyntax = false;

  if (keys.length === 1) {
    // Trivial case when getter invoked with one string key name, thusly:
    // const foo = $get('foo')
    if (validKey(keys[0])) {
      return vm.$retrieve(keys[0]);
    } else if (_typeof(keys[0]) === 'object') {
      keys = keys[0];

      if (!Array.isArray(keys)) {
        objectSyntax = true;
      }
    }
  }

  var bindings = normalizeBindings(keys);
  return objectSyntax ? mapProps(vm, bindings) : mapPropsToArray(vm, bindings);
};
var multiSet = function multiSet(vm, key, value) {
  var kv;

  if (key && _typeof(key) === 'object' && !Array.isArray(key)) {
    kv = key;
  } else if (validKey(key)) {
    kv = _defineProperty({}, key, value);
  }

  if (!kv) {
    throw new Error("Invalid arguments: key \"".concat(JSON.stringify(key), "\", ") + "value: \"".concat(JSON.stringify(value), "\""));
  }

  var ownerMap = new Map();
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = getKeys(kv)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var k = _step.value;

      var _getStateKeyOwner3 = getStateKeyOwner(vm, k),
          _getStateKeyOwner4 = _slicedToArray(_getStateKeyOwner3, 2),
          owner = _getStateKeyOwner4[0],
          depth = _getStateKeyOwner4[1];

      var o = ownerMap.get(owner);

      if (o == null) {
        o = {
          owner: owner,
          depth: depth,
          values: {}
        };
        ownerMap.set(owner, o);
      }

      o.values[k] = kv[k];
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var sortedQueue = _toConsumableArray(ownerMap.values()).sort(function (a, b) {
    // Shouldn't ever happen but hey...
    if (process.env.NODE_ENV !== 'production') {
      if (a.depth === b.depth) {
        throw new Error("Two owner ViewModels of equal depth?!");
      }
    }

    return a.depth < b.depth ? 1 : -1;
  });

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = sortedQueue[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var item = _step2.value;
      var _owner = item.owner,
          values = item.values;

      _owner.setState(values);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }
};
var accessorizeViewModel = function accessorizeViewModel(vm) {
  vm.$retrieve = function (key) {
    return retrieve(vm, key);
  };

  vm.$retrieve[accessorType] = 'retrieve';

  vm.$get = function (key) {
    return getter(vm, key);
  };

  vm.$get[accessorType] = 'get';

  vm.$multiGet = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return multiGet(vm, args);
  };

  vm.$multiGet[accessorType] = 'get';

  vm.$set = function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return setter.apply(void 0, [vm].concat(args));
  };

  vm.$set[accessorType] = 'set';
  vm.$dispatch = vm.$dispatch || vm.parent.$dispatch;
  return vm;
};
var validateInitialState = function validateInitialState(state) {
  if (state && _typeof(state) === 'object' && !Array.isArray(state)) {
    return true;
  }

  throw new Error("Invalid initialState: ".concat(JSON.stringify(state)));
};

var expose = function expose(_ref) {
  var $get = _ref.$get,
      $set = _ref.$set,
      $dispatch = _ref.$dispatch;
  return {
    $get: $get,
    $set: $set,
    $dispatch: $dispatch
  };
};
var dispatcher = function dispatcher(vc, event, payload) {
  var _findOwner = findOwner(vc, 'handlers', event),
      _findOwner2 = _slicedToArray(_findOwner, 1),
      owner = _findOwner2[0];

  var handler = owner && owner.handlers[event];

  if (typeof handler === 'function') {
    vc.defer.apply(vc, [handler, vc, true].concat(_toConsumableArray(payload)));
  } else {
    rootViewController.$dispatch.apply(rootViewController, [event].concat(_toConsumableArray(payload)));
  }
};

var accessorizeViewController = function accessorizeViewController(vm, vc) {
  vc.$get = function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return multiGet(vm, args);
  };

  vc.$get[accessorType] = 'get';

  vc.$set = function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return multiSet.apply(void 0, [vm].concat(args));
  };

  vc.$set[accessorType] = 'set';

  vc.$dispatch = function (event) {
    for (var _len3 = arguments.length, payload = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
      payload[_key3 - 1] = arguments[_key3];
    }

    return dispatcher(vc, event, payload);
  };

  vc.$dispatch[accessorType] = 'dispatch';
  return vc;
};

var ViewController =
/*#__PURE__*/
function (_React$Component) {
  _inherits(ViewController, _React$Component);

  function ViewController(props) {
    var _this;

    _classCallCheck(this, ViewController);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ViewController).call(this, props));
    _this.id = 'id' in props ? props.id : 'ownerId' in props ? "".concat(props.ownerId, "-controller") : getId('ViewController');
    _this.timerMap = new Map();
    _this.defer = _this.defer.bind(_assertThisInitialized(_this));
    _this.runRenderHandlers = _this.runRenderHandlers.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(ViewController, [{
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.timerMap.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var timer = _step.value;
          clearTimeout(timer);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.timerMap.clear();
    }
  }, {
    key: "defer",
    value: function defer(fn, vc) {
      var cancel = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      for (var _len4 = arguments.length, args = new Array(_len4 > 3 ? _len4 - 3 : 0), _key4 = 3; _key4 < _len4; _key4++) {
        args[_key4 - 3] = arguments[_key4];
      }

      var timer = this.timerMap.get(fn);

      if (timer) {
        if (cancel) {
          clearTimeout(timer);
          this.timerMap["delete"](fn);
        } else {
          console.warn('Double executing handler function: ', fn.toString());
        }
      }

      timer = _defer(function () {
        fn.apply(void 0, [expose(vc)].concat(args));
      });
      this.timerMap.set(fn, timer);
    }
  }, {
    key: "runRenderHandlers",
    value: function runRenderHandlers(vc, props) {
      var me = this;
      var initialize = props.initialize,
          invalidate = props.invalidate;

      if (!me.$initialized) {
        if (typeof initialize === 'function') {
          var initializeWrapper = me.$initializeWrapper || (me.$initializeWrapper = function () {
            // Initializer function is possibly making changes to the
            // parent ViewModel state, which might cause extra rendering
            // of this ViewController. To avoid extraneous invocations
            // of the initializer function, clear the flags before invoking it.
            me.$initialized = true;
            delete me.$initializeWrapper;
            initialize.apply(void 0, arguments);
          }); // We have to defer executing the function because setting state
          // is prohibited during rendering cycle.


          me.defer(initializeWrapper, vc, true);
        } else {
          me.$initialized = true;
        }
      } else {
        // Same as `initialize`, we need to run `invalidate`
        // out of event loop.
        if (typeof invalidate === 'function') {
          me.defer(invalidate, vc, true); // Cancel previous invocation
        }
      }
    }
  }, {
    key: "render",
    value: function render() {
      var me = this;
      var _me$props = me.props,
          id = _me$props.id,
          $viewModel = _me$props.$viewModel,
          handlers = _me$props.handlers,
          children = _me$props.children;

      var innerVC = function innerVC(_ref2) {
        var vm = _ref2.vm;
        return React.createElement(ViewControllerContext.Consumer, null, function (parent) {
          var vc = accessorizeViewController(vm, {
            id: id || me.id,
            parent: parent,
            handlers: handlers,
            defer: me.defer
          }); // ViewModel needs dispatcher reference to fire events
          // for corresponding protected keys.

          vm.$dispatch = vc.$dispatch; // We *need* to run initialize and invalidate handlers during rendering,
          // as opposed to a lifecycle method such as `componentDidMount`.
          // The purpose of these functions is to do something that might affect
          // parent ViewModel state, and we need to have the `vm` ViewModel
          // object reference to be able to do that. `vm` comes either from
          // ViewModelContext, or directly injected by parent ViewModel,
          // but in each case that happens during rendering cycle,
          // not before or after.

          me.runRenderHandlers(vc, me.props);
          return React.createElement(ViewControllerContext.Provider, {
            value: vc
          }, children);
        });
      };

      return $viewModel ? innerVC({
        vm: $viewModel
      }) : React.createElement(ViewModelContext.Consumer, null, innerVC);
    }
  }]);

  return ViewController;
}(React.Component);

var dotRe = /\./;
var applyViewModelState = function applyViewModelState(currentState, values) {
  var newState = _objectSpread2({}, currentState);

  var updated = false;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = getKeys(values)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var key = _step.value;
      var value = values[key]; // Cheaper operation if no deep inspection is necessary.

      if (_typeof(key) === 'symbol' || !dotRe.test(key)) {
        if (!Object.is(currentState[key], value)) {
          newState[key] = value;
          updated = true;
        }
      } else {
        var hasKey = loHas(currentState, key);
        var oldValue = loGet(currentState, key); // All this awkward gymnastics with cloning is to force ViewModel re-render
        // upon value change. 
        // TODO Come up with a better way to solve this problem.

        if (!hasKey || !Object.is(oldValue, value)) {
          var prefix = getKeyPrefix(key);
          var copy = loClone(currentState[prefix]);
          newState[prefix] = copy;
          loSet(newState, key, value);
          updated = true;
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return updated ? newState : currentState;
};

var ViewModelState =
/*#__PURE__*/
function (_React$Component) {
  _inherits(ViewModelState, _React$Component);

  _createClass(ViewModelState, null, [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(props, localState) {
      var vm = props.vm,
          applyState = props.applyState;

      if (applyState) {
        var result = applyState(localState, vm.$multiGet); // If applyState() does not return a value, result will be `undefined`.
        // React complains about this, loudly; returning `null` instead is ok.

        return result == null ? null : result;
      }

      return null;
    }
  }]);

  function ViewModelState(props) {
    var _this;

    _classCallCheck(this, ViewModelState);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ViewModelState).call(this, props));
    _this.setViewModelState = _this.setViewModelState.bind(_assertThisInitialized(_this));
    _this.getKeySetter = _this.getKeySetter.bind(_assertThisInitialized(_this));
    var initialState = props.initialState,
        protectedKeys = props.protectedKeys,
        vm = props.vm;

    if (protectedKeys != null) {
      _this.protectedKeys = normalizeProtectedKeys(protectedKeys);
    }

    if (typeof initialState === 'function') {
      initialState = initialState(vm.$multiGet);
    }

    if (process.env.NODE_ENV !== 'production') {
      validateInitialState(initialState);
    }

    _this.state = _objectSpread2({}, initialState);
    return _this;
  }

  _createClass(ViewModelState, [{
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      var _this$props = this.props,
          vm = _this$props.vm,
          observeStateChange = _this$props.observeStateChange;

      if (typeof observeStateChange === 'function') {
        observeStateChange(vm.store);
      }
    }
  }, {
    key: "getKeySetter",
    value: function getKeySetter(vm, key) {
      if (!(key in vm.state) && key in vm.data) {
        throw new Error("Setting read-only key \"".concat(String(key), "\" is not allowed."));
      }

      var setter = function setter(value) {
        return vm.$set(key, value);
      };

      setter[accessorType] = 'set';
      return setter;
    }
  }, {
    key: "setViewModelState",
    value: function setViewModelState(props) {
      var me = this;
      return new Promise(function (resolve) {
        me.setState(function (state) {
          return applyViewModelState(state, props);
        }, function () {
          resolve(true);
        });
      });
    }
  }, {
    key: "render",
    value: function render() {
      var me = this;
      var _me$props = me.props,
          vm = _me$props.vm,
          children = _me$props.children;
      vm.state = chain(vm.parent.state, me.state);
      vm.store = chain(vm.parent.store, vm.data, me.state);
      vm.protectedKeys = me.protectedKeys;
      vm.getKeySetter = me.getKeySetter;
      vm.setState = me.setViewModelState;
      var innerViewModel = React.createElement(ViewModelContext.Provider, {
        value: {
          vm: vm
        }
      }, children);
      var controller = me.props.controller || (me.protectedKeys ? {} : null);
      return !controller ? innerViewModel : React.createElement(ViewController, _extends({}, controller, {
        $viewModel: vm,
        ownerId: vm.id
      }), innerViewModel);
    }
  }]);

  return ViewModelState;
}(React.Component);
/*
 * Accepted props:
 *  id, data, initialState, formulas, applyState, observeStateChange, controller,
 *  protectedKeys, children
 */


var ViewModel = function ViewModel(props) {
  return React.createElement(ViewModelContext.Consumer, null, function (_ref) {
    var parent = _ref.vm;
    var formulas = chain(parent.formulas, props.formulas);
    var data = chain(parent.data, props.data);
    var state = chain(parent.state, {}); // At this point, our store contains only data

    var store = chain(parent.store, props.data);
    var vm = accessorizeViewModel({
      id: 'id' in props ? props.id : getId('ViewModel'),
      parent: parent,
      formulas: formulas,
      data: data,
      state: state,
      // This property gets overwritten by ViewModelState.render(); the purpose
      // of having it here is to provide initial store object for applyState()
      // and initialState()
      store: store
    });
    return React.createElement(ViewModelState, {
      vm: vm,
      controller: props.controller,
      initialState: props.initialState,
      applyState: props.applyState,
      observeStateChange: props.observeStateChange,
      protectedKeys: props.protectedKeys
    }, props.children);
  });
};
ViewModel.defaultProps = {
  data: {},
  initialState: {},
  formulas: {},
  applyState: null
};

var Bind = function Bind(_ref) {
  var props = _ref.props,
      controller = _ref.controller,
      children = _ref.children;
  var bindings = normalizeBindings(props);
  return React.createElement(ViewModelContext.Consumer, null, function (_ref2) {
    var vm = _ref2.vm;
    return !controller ? children(mapProps(vm, bindings)) : React.createElement(ViewControllerContext.Consumer, null, function (vc) {
      return children(mapProps(vm, bindings), expose(vc));
    });
  });
};

var withBindings = function withBindings(boundProps) {
  return function (Component) {
    var bindings = normalizeBindings(boundProps); // Bound props come *last*, which bears the possibility of clobbering similar named
    // props passed to component from elsewhere. This tradeoff, however, is much better
    // from debugging standpoint than the other way around.

    var ComponentWithBindings = function ComponentWithBindings(componentProps) {
      return React.createElement(ViewModelContext.Consumer, null, function (_ref) {
        var vm = _ref.vm;
        return React.createElement(Component, _extends({}, componentProps, mapProps(vm, bindings)));
      });
    };

    return ComponentWithBindings;
  };
};

var useBindings = function useBindings() {
  var _useContext = useContext(ViewModelContext),
      vm = _useContext.vm;

  for (var _len = arguments.length, _bindings = new Array(_len), _key = 0; _key < _len; _key++) {
    _bindings[_key] = arguments[_key];
  }

  return multiGet(vm, _bindings);
};

var useController = function useController() {
  var vc = useContext(ViewControllerContext);
  return {
    $get: vc.$get,
    $set: vc.$set,
    $dispatch: vc.$dispatch
  };
};

export default ViewModel;
export { Bind, ViewController, useBindings, useController, withBindings };
