"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _Object$defineProperty = require("@babel/runtime-corejs2/core-js/object/define-property");

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports.restoreAccountDb = void 0;

var _stringify = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/json/stringify"));

var _promise = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/promise"));

var _commander = _interopRequireDefault(require("commander"));

var _colors = _interopRequireDefault(require("colors"));

var _process = _interopRequireDefault(require("process"));

var _fs = _interopRequireDefault(require("fs"));

var _firebaseAdmin = _interopRequireDefault(require("firebase-admin"));

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _path = _interopRequireDefault(require("path"));

var _jsonStableStringify = _interopRequireDefault(require("json-stable-stringify"));

var _FirestoreFunctions = require("./lib/FirestoreFunctions");

var _FirestoreDocument = require("./lib/FirestoreDocument");

var accountCredentialsPathParamKey = 'accountCredentials';
var accountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file';
var backupPathParamKey = 'backupPath';
var backupPathParamDescription = 'Path to store backup';
var restoreAccountCredentialsPathParamKey = 'restoreAccountCredentials';
var restoreAccountCredentialsPathParamDescription = 'Google Cloud account credentials JSON file for restoring documents';
var prettyPrintParamKey = 'prettyPrint';
var prettyPrintParamDescription = 'JSON backups done with pretty-printing';
var stableParamKey = 'stable';
var stableParamParamDescription = 'JSON backups done with stable-stringify';
var plainJSONBackupParamKey = 'plainJSONBackup';
var plainJSONBackupParamDescription = "JSON backups done without preserving any type information\n                                          - Lacks full fidelity restore to Firestore\n                                          - Can be used for other export purposes";
var packagePath = __dirname.includes('/build') ? '..' : '.';
var version = 'N/A - unable to read package.json file';

try {
  version = require("".concat(packagePath, "/package.json")).version;
} catch (requireError) {} // The data to be restored can replace the existing ones
// or they can be merged with existing ones


var mergeData = false;

_commander["default"].version(version).option('-a, --' + accountCredentialsPathParamKey + ' <path>', accountCredentialsPathParamDescription).option('-B, --' + backupPathParamKey + ' <path>', backupPathParamDescription).option('-a2, --' + restoreAccountCredentialsPathParamKey + ' <path>', restoreAccountCredentialsPathParamDescription).option('-P, --' + prettyPrintParamKey, prettyPrintParamDescription).option('-S, --' + stableParamKey, stableParamParamDescription).option('-J, --' + plainJSONBackupParamKey, plainJSONBackupParamDescription).parse(_process["default"].argv);

var accountCredentialsPath = _commander["default"][accountCredentialsPathParamKey];

if (accountCredentialsPath && !_fs["default"].existsSync(accountCredentialsPath)) {
  console.log(_colors["default"].bold(_colors["default"].red('Account credentials file does not exist: ')) + _colors["default"].bold(accountCredentialsPath));

  _commander["default"].help();

  _process["default"].exit(1);
}

var backupPath = _commander["default"][backupPathParamKey];

if (!backupPath) {
  console.log(_colors["default"].bold(_colors["default"].red('Missing: ')) + _colors["default"].bold(backupPathParamKey) + ' - ' + backupPathParamDescription);

  _commander["default"].help();

  _process["default"].exit(1);
}

var restoreAccountCredentialsPath = _commander["default"][restoreAccountCredentialsPathParamKey];

if (restoreAccountCredentialsPath && !_fs["default"].existsSync(restoreAccountCredentialsPath)) {
  console.log(_colors["default"].bold(_colors["default"].red('Restore account credentials file does not exist: ')) + _colors["default"].bold(restoreAccountCredentialsPath));

  _commander["default"].help();

  _process["default"].exit(1);
}

var prettyPrint = _commander["default"][prettyPrintParamKey] !== undefined && _commander["default"][prettyPrintParamKey] !== null;
var stable = _commander["default"][stableParamKey] !== undefined && _commander["default"][stableParamKey] !== null;
var plainJSONBackup = _commander["default"][plainJSONBackupParamKey] !== undefined && _commander["default"][plainJSONBackupParamKey] !== null;
var accountApp = accountCredentialsPath ? (0, _FirestoreFunctions.getFireApp)(accountCredentialsPath) : {};

try {
  _mkdirp["default"].sync(backupPath);
} catch (error) {
  console.log(_colors["default"].bold(_colors["default"].red('Unable to create backup path: ')) + _colors["default"].bold(backupPath) + ' - ' + error);

  _process["default"].exit(1);
}

var restoreAccountApp = restoreAccountCredentialsPath ? (0, _FirestoreFunctions.getFireApp)(restoreAccountCredentialsPath) : {}; // from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e

var promiseSerial = function promiseSerial(funcs) {
  return funcs.reduce(function (promise, func) {
    return promise.then(function (result) {
      return func().then(function () {
        return Array.prototype.concat.bind(result);
      });
    });
  }, _promise["default"].resolve([]));
};

var backupDocument = function backupDocument(document, backupPath, logPath) {
  console.log("Backing up Document '" + logPath + document.id + "'" + (plainJSONBackup === true ? ' with -J --plainJSONBackup' : ' with type information'));

  try {
    _mkdirp["default"].sync(backupPath);

    var fileContents;
    var documentBackup = plainJSONBackup === true ? document.data() : (0, _FirestoreDocument.constructDocumentObjectToBackup)(document.data());

    if (prettyPrint === true) {
      if (stable === true) {
        fileContents = (0, _jsonStableStringify["default"])(documentBackup, {
          space: 2
        });
      } else {
        fileContents = (0, _stringify["default"])(documentBackup, null, 2);
      }
    } else {
      if (stable === true) {
        fileContents = (0, _jsonStableStringify["default"])(documentBackup);
      } else {
        fileContents = (0, _stringify["default"])(documentBackup);
      }
    }

    _fs["default"].writeFileSync(backupPath + '/' + document.id + '.json', fileContents);

    return document.ref.getCollections().then(function (collections) {
      return promiseSerial(collections.map(function (collection) {
        return function () {
          return backupCollection(collection, backupPath + '/' + collection.id, logPath + document.id + '/');
        };
      }));
    });
  } catch (error) {
    console.log(_colors["default"].bold(_colors["default"].red("Unable to create backup path or write file, skipping backup of Document '" + document.id + "': ")) + _colors["default"].bold(backupPath) + ' - ' + error);
    return _promise["default"].reject(error);
  }
};

var backupCollection = function backupCollection(collection, backupPath, logPath) {
  console.log("Backing up Collection '" + logPath + collection.id + "'"); // TODO: implement feature to skip certain Collections
  // if (collection.id.toLowerCase().indexOf('geotrack') > 0) {
  //   console.log(`Skipping ${collection.id}`);
  //   return promiseSerial([() => Promise.resolve()]);
  // }

  try {
    _mkdirp["default"].sync(backupPath);

    return collection.get().then(function (snapshots) {
      var backupFunctions = [];
      snapshots.forEach(function (document) {
        backupFunctions.push(function () {
          var backupDocumentPromise = backupDocument(document, backupPath + '/' + document.id, logPath + collection.id + '/');
          restoreDocument(logPath + collection.id, document);
          return backupDocumentPromise;
        });
      });
      return promiseSerial(backupFunctions);
    });
  } catch (error) {
    console.log(_colors["default"].bold(_colors["default"].red("Unable to create backup path, skipping backup of Collection '" + collection.id + "': ")) + _colors["default"].bold(backupPath) + ' - ' + error);
    return _promise["default"].reject(error);
  }
};

var accountDb = accountCredentialsPath ? accountApp.firestore() : null;
var restoreAccountDb = restoreAccountCredentialsPath ? restoreAccountApp.firestore() : null;
exports.restoreAccountDb = restoreAccountDb;

var restoreDocument = function restoreDocument(collectionName, document) {
  var restoreMsg = "Restoring to collection ".concat(collectionName, " document ").concat(document.id);
  console.log("".concat(restoreMsg, "..."));
  return _promise["default"].resolve( // TODO: use saveDocument using merge as an option
  !restoreAccountDb ? null : restoreAccountDb.collection(collectionName).doc(document.id).set(document.data()))["catch"](function (error) {
    console.log(_colors["default"].bold(_colors["default"].red("Error! ".concat(restoreMsg) + ' - ' + error)));
  });
};

var restoreBackup = function restoreBackup(path, restoreAccountDb) {
  var promisesChain = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var promisesResult = promisesChain;

  _fs["default"].readdirSync(path).forEach(function (element) {
    var elementPath = "".concat(path, "/").concat(element);

    var stats = _fs["default"].statSync(elementPath);

    var isDirectory = stats.isDirectory();

    if (isDirectory) {
      var folderPromises = restoreBackup(elementPath, restoreAccountDb, promisesChain);
      promisesResult.concat(folderPromises);
    } else {
      var documentId = path.split('/').pop();
      var pathWithoutId = path.substr(0, path.lastIndexOf('/')); // remove from the path the global backupPath

      var pathWithoutBackupPath = pathWithoutId.replace(backupPath, '');
      var collectionName = pathWithoutBackupPath;
      var restoreMsg = "Restoring to collection ".concat(collectionName, " document ").concat(elementPath);
      console.log("".concat(restoreMsg));

      var documentDataValue = _fs["default"].readFileSync(elementPath);

      var documentData = (0, _FirestoreDocument.constructFirestoreDocumentObject)(JSON.parse(documentDataValue), {
        firestore: restoreAccountDb
      });
      promisesResult.push((0, _FirestoreDocument.saveDocument)(restoreAccountDb, collectionName, documentId, documentData, {
        merge: mergeData
      })["catch"](function (saveError) {
        var saveErrorMsg = "\n !!! Uh-Oh, error saving collection ".concat(collectionName, " document ").concat(elementPath);
        console.error(saveErrorMsg, saveError);

        if (!saveError.metadata) {
          saveError.metadata = {};
        }

        saveError.metadata.collectionName = collectionName;
        saveError.metadata.document = elementPath;
        return _promise["default"].reject(saveError);
      }));
    }
  });

  return promisesResult;
};

var mustExecuteBackup = !!accountDb || !!accountDb && !!restoreAccountDb;

if (mustExecuteBackup) {
  accountDb.getCollections().then(function (collections) {
    return promiseSerial(collections.map(function (collection) {
      return function () {
        return backupCollection(collection, backupPath + '/' + collection.id, '/');
      };
    }));
  });
}

var mustExecuteRestore = !accountDb && !!restoreAccountDb && !!backupPath;

if (mustExecuteRestore) {
  var promisesRes = restoreBackup(backupPath, restoreAccountDb);

  _promise["default"].all(promisesRes).then(function (restoration) {
    return console.log("\n -- Restore Completed! -- \n");
  })["catch"](function (errors) {
    console.log("\n !!! Restore NOT Complete; there were Errors !!!\n");
    (errors instanceof Array ? errors : [errors]).map(console.error);
  });
}