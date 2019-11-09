"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty2 = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty2(exports, "__esModule", {
  value: true
});

exports.constructDocumentObjectToBackup = exports.constructFirestoreDocumentObject = exports.saveDocument = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-property"));

var _defineProperties = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/define-properties"));

var _getOwnPropertyDescriptors = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptors"));

var _getOwnPropertyDescriptor = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-descriptor"));

var _getOwnPropertySymbols = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/get-own-property-symbols"));

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));

var _defineProperty3 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/defineProperty"));

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

var _FirestoreTypes = require("./FirestoreTypes");

var _types = require("./types");

var _FirestoreFunctions = require("./FirestoreFunctions");

function ownKeys(object, enumerableOnly) { var keys = (0, _keys["default"])(object); if (_getOwnPropertySymbols["default"]) { var symbols = (0, _getOwnPropertySymbols["default"])(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return (0, _getOwnPropertyDescriptor["default"])(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty3["default"])(target, key, source[key]); }); } else if (_getOwnPropertyDescriptors["default"]) { (0, _defineProperties["default"])(target, (0, _getOwnPropertyDescriptors["default"])(source)); } else { ownKeys(source).forEach(function (key) { (0, _defineProperty2["default"])(target, key, (0, _getOwnPropertyDescriptor["default"])(source, key)); }); } } return target; }

var saveDocument = function saveDocument(firestoreAccountDb, collectionName, documentId, data) {
  var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {
    merge: false
  };
  var doc = firestoreAccountDb.collection(collectionName).doc(documentId);
  return doc.set(data, options);
};
/**
 * Object construction function to be stored on Firestore
 * For each document backup data object, is created an object ready to be stored
 * in firestore database.
 * Pass in firestore instance as second options parameter to properly
 * reconstruct DocumentReference values
 *
 * Example:
 * Backup Object Document
 * { name: { value: 'Jhon', type: 'string' }, age: { value: 26, type: 'number' }}
 * Object to be restored
 * { name: 'Jhon', age: 26 }
 * (see available types on FirestoreTypes file)
 */


exports.saveDocument = saveDocument;

var constructFirestoreDocumentObject = function constructFirestoreDocumentObject(documentData_) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      firestore = _ref.firestore,
      isArrayItem = _ref.isArrayItem;

  if (!(0, _types.isObject)(documentData_)) {
    console.warn("Invalid documentData, ".concat(documentData, ", passed to \n      constructFirestoreDocumentObject()"));
    return;
  }

  var documentDataToStore = {};
  var documentData = documentData_;
  var keys = (0, _keys["default"])(documentData);

  if (isArrayItem) {
    // documentData was an array item, such as
    // { arrayName: [{name: 'fiona', type: 'string']}
    // and then called this function recursively with the first item, such as
    // {name: 'fiona', type: 'string'} so add a temporary key
    // to process it like the other field types
    documentData = {
      __arrayItem__: documentData
    };
    keys = (0, _keys["default"])(documentData);
  }

  keys.forEach(function (key) {
    var _ref2 = documentData[key] || {},
        value = _ref2.value,
        type = _ref2.type;

    if (type === _FirestoreTypes.TYPES.BOOLEAN) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.TIMESTAMP) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, new Date(value)));
    } else if (type === _FirestoreTypes.TYPES.NUMBER) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.ARRAY) {
      var childFieldObject = value.reduce(function (acc, cur) {
        var element = constructFirestoreDocumentObject(cur, {
          isArrayItem: true,
          firestore: firestore
        });
        acc.push(element.__arrayItem__);
        return acc;
      }, []);
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, childFieldObject));
    } else if (type === _FirestoreTypes.TYPES.OBJECT) {
      var _childFieldObject = (0, _keys["default"])(value).reduce(function (acc, cur, i) {
        var element = constructFirestoreDocumentObject((0, _defineProperty3["default"])({}, cur, value[cur]), {
          firestore: firestore
        });
        acc[cur] = element[cur];
        return acc;
      }, {});

      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, _childFieldObject));
    } else if (type === _FirestoreTypes.TYPES.NULL) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, null));
    } else if (type === _FirestoreTypes.TYPES.STRING) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, value));
    } else if (type === _FirestoreTypes.TYPES.DOCUMENT_REFERENCE) {
      if (!firestore) {
        var valueStr = value;

        try {
          valueStr = (0, _stringify["default"])(value);
        } catch (valueNotAnObjErr) {}

        console.error("Cannot properly create DocumentReference\n          without firestore credentials. Firestore is ".concat(firestore, ". \n          Skipping field: ").concat(valueStr));
      } else {
        var documentReference = (0, _FirestoreFunctions.constructDocumentReference)(firestore, value._referencePath);
        documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, documentReference));
      }
    } else if (type === _FirestoreTypes.TYPES.GEOPOINT) {
      var geopoint = new _firebaseAdmin["default"].firestore.GeoPoint(value._latitude, value._longitude);
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, geopoint));
    } else {
      console.warn("Unsupported type, ".concat(type, " from {").concat(key, ": ").concat(value, "} in ").concat((0, _stringify["default"])(documentData)));
    }
  }); // Convert __arrayItem__ to an array

  return documentDataToStore;
};
/**
 * Object construction function to document backup
 * for each document data object is created an object that contains the fields
 * of the original data with their types.
 * (see available types on FirestoreTypes file)
 * Example:
 * Original Object Document
 * { name: 'Jhon', age: 26 }
 * Object to backup
 * { name: { value: 'Jhon', type: 'string' }, age: { value: 26, type: 'number' }}
 */


exports.constructFirestoreDocumentObject = constructFirestoreDocumentObject;

var constructDocumentObjectToBackup = function constructDocumentObjectToBackup(documentData_) {
  var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      isArrayItem = _ref3.isArrayItem;

  var documentDataToStore = {};
  var documentData = documentData_;

  if (isArrayItem) {
    // documentData was an array item, such as { arrayName: ['fiona'] }
    // and then called this function recursively with the first item, such as
    // 'fiona' so add a temporary key to process it like the other field types
    documentData = {
      __arrayItem__: documentData
    };
  }

  (0, _keys["default"])(documentData).forEach(function (key) {
    var value = documentData[key];

    if ((0, _types.isBoolean)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isBoolean)(value)));
    } else if ((0, _types.isDate)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isDate)(value)));
    } else if ((0, _types.isNumber)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isNumber)(value)));
    } else if ((0, _types.isArray)(value)) {
      var childFieldBackup = value.reduce(function (acc, cur) {
        var element = constructDocumentObjectToBackup(cur, {
          isArrayItem: true
        });
        acc.push(element.__arrayItem__);
        return acc;
      }, []);
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isArray)(childFieldBackup)));
    } else if ((0, _types.isObject)(value)) {
      var _childFieldBackup = (0, _keys["default"])(value).reduce(function (acc, cur) {
        var element = constructDocumentObjectToBackup((0, _defineProperty3["default"])({}, cur, value[cur]));
        acc[cur] = element[cur];
        return acc;
      }, {});

      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isObject)(_childFieldBackup)));
    } else if ((0, _types.isNull)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isNull)(value)));
    } else if ((0, _types.isString)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isString)(value)));
    } else if ((0, _types.isGeopoint)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isGeopoint)(value)));
    } else if ((0, _types.isDocumentReference)(value)) {
      documentDataToStore = _objectSpread({}, documentDataToStore, (0, _defineProperty3["default"])({}, key, (0, _types.isDocumentReference)(value)));
    } else {
      console.warn("Unsupported value type for {".concat(key, ": ").concat(value, "}"));
    }
  });
  return documentDataToStore;
};

exports.constructDocumentObjectToBackup = constructDocumentObjectToBackup;