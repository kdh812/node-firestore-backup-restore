"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.isGeopoint = exports.isDocumentReference = exports.isDate = exports.isBoolean = exports.isNull = exports.isObject = exports.isArray = exports.isNumber = exports.isString = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/typeof"));

var _assign = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/assign"));

var _create = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/create"));

var _FirestoreTypes = require("./FirestoreTypes");

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

function clone(objToClone, _ref) {
  var _ref$prototype = _ref.prototype,
      prototype = _ref$prototype === void 0 ? Object.prototype : _ref$prototype;
  var clonedObj = (0, _create["default"])(prototype);
  return (0, _assign["default"])(clonedObj, objToClone);
} // Returns if a value is a string


var isString = function isString(value) {
  if (typeof value === 'string' || value instanceof String) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.STRING
    };
  }

  return false;
}; // Returns if a value is really a number


exports.isString = isString;

var isNumber = function isNumber(value) {
  if (typeof value === 'number' && isFinite(value)) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.NUMBER
    };
  }

  return false;
}; // Returns if a value is an array


exports.isNumber = isNumber;

var isArray = function isArray(value) {
  if (value && (0, _typeof2["default"])(value) === 'object' && value.constructor === Array) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.ARRAY
    };
  }

  return false;
}; // Returns if a value is an object


exports.isArray = isArray;

var isObject = function isObject(value) {
  if (value && (0, _typeof2["default"])(value) === 'object' && value.constructor === Object) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.OBJECT
    };
  }

  return false;
}; // Returns if a value is null


exports.isObject = isObject;

var isNull = function isNull(value) {
  if (value === null) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.NULL
    };
  }

  return false;
}; // Returns if a value is a boolean


exports.isNull = isNull;

var isBoolean = function isBoolean(value) {
  if (typeof value === 'boolean') {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.BOOLEAN
    };
  }

  return false;
}; // Returns if value is a date object


exports.isBoolean = isBoolean;

var isDate = function isDate(value) {
  if (value instanceof Date) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.TIMESTAMP
    };
  }

  return false;
};

exports.isDate = isDate;

var isDocumentReference = function isDocumentReference(value) {
  if (value instanceof _firebaseAdmin["default"].firestore.DocumentReference) {
    // Create a clone to ensure instance of DocumentReference and to mutate
    var documentReference = clone(value, _firebaseAdmin["default"].firestore.DocumentReference.prototype); // Remove _firestore as it is unnecessary and we do not want to keep it

    delete documentReference._firestore;
    return {
      value: documentReference,
      type: _FirestoreTypes.TYPES.DOCUMENT_REFERENCE
    };
  }

  return false;
};

exports.isDocumentReference = isDocumentReference;

var isGeopoint = function isGeopoint(value) {
  if (value instanceof _firebaseAdmin["default"].firestore.GeoPoint) {
    return {
      value: value,
      type: _FirestoreTypes.TYPES.GEOPOINT
    };
  }

  return false;
};

exports.isGeopoint = isGeopoint;