"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.constructDocumentReference = exports.getFireApp = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/toConsumableArray"));

var _colors = _interopRequireDefault(require("colors"));

var _fs = _interopRequireDefault(require("fs"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

// Helper functions to work with Firestore instances
// Initializes and returns Firebase App and then .firestore() can be called
var getFireApp = function getFireApp(credentialsPath, appName) {
  try {
    var credentialsBuffer = _fs["default"].readFileSync(credentialsPath);

    var credentials = JSON.parse(credentialsBuffer.toString());
    return _firebaseAdmin["default"].initializeApp({
      credential: _firebaseAdmin["default"].credential.cert(credentials)
    }, appName || credentialsPath);
  } catch (error) {
    console.log(_colors["default"].bold(_colors["default"].red('Unable to read: ')) + _colors["default"].bold(credentialsPath) + ' - ' + error);
    return error;
  }
}; // Create a DocumentReference instance without the _firestore field since
// it does not need to be stored or used for restoring - The restore firestore
// is used to change DocumentReference app partition to the restore database
//
// firestore is a FirebaseApp firestore instance
// referencePath looks like:
// "_referencePath": {
//   "segments": ["CompanyCollection", "An7xh0LqvWDocumentId",
//      "RoomsSubCollection", "conferenceRoom-001"],
//   "_projectId": "backuprestore-f8687",
//   "_databaseId": "(default)"
// }


exports.getFireApp = getFireApp;

var constructDocumentReference = function constructDocumentReference(firestore, referencePath) {
  if (!firestore || !referencePath || !referencePath.segments) {
    return;
  }

  var segments = (0, _toConsumableArray2["default"])(referencePath.segments);
  var docRef = firestore;

  while (segments.length) {
    var collectionName = segments.shift();
    var documentName = segments.shift();
    docRef = docRef.collection(collectionName).doc(documentName);
  } // Create proper instance of DocumentReference


  var documentReference = new _firebaseAdmin["default"].firestore.DocumentReference(firestore, docRef._referencePath); // Remove _firestore field since it is not necessary

  delete documentReference._firestore;
  return documentReference;
};

exports.constructDocumentReference = constructDocumentReference;