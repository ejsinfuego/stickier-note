var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var fs = require('fs');
var path2 = require('path');
var elect = require('electron').app;
// Safely import nedb with fallbacks
var Datastore;
try {
    // First try the standard import
    Datastore = require('nedb');
}
catch (error) {
    try {
        // If standard import fails, try from resources path for packaged app
        var appPath = elect.getAppPath();
        var resourcesPath = process.resourcesPath;
        console.log('App path:', appPath);
        console.log('Resources path:', resourcesPath);
        // Try different possible locations for the nedb module
        var possiblePaths = [
            path2.join(resourcesPath, 'node_modules', 'nedb'),
            path2.join(appPath, 'node_modules', 'nedb'),
            path2.join(resourcesPath, 'app.asar.unpacked', 'node_modules', 'nedb'),
            path2.join(path2.dirname(appPath), 'node_modules', 'nedb')
        ];
        console.log('Trying to load nedb from possible paths:', possiblePaths);
        var loaded = false;
        for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
            var modulePath = possiblePaths_1[_i];
            try {
                if (fs.existsSync(path2.join(modulePath, 'index.js'))) {
                    console.log('Found nedb at:', modulePath);
                    Datastore = require(modulePath);
                    loaded = true;
                    break;
                }
            }
            catch (err) {
                console.log("Failed to load from ".concat(modulePath, ":"), err.message);
            }
        }
        if (!loaded) {
            throw new Error('Could not find nedb module in any location');
        }
    }
    catch (innerError) {
        console.error('Failed to load nedb module:', innerError);
        throw innerError;
    }
}
var dbDir = elect.getPath('userData');
var dbPath = path2.join(dbDir, 'stickier-notes.db');
// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Database directory created:', dbDir);
}
else {
    console.log('Database directory already exists:', dbDir);
}
console.log('Database Path:', dbPath);
// Initialize database
var db = new Datastore({ filename: dbPath, autoload: true });
function saveNote(noteData) {
    console.log('Saving note:', noteData);
    return new Promise(function (resolve, reject) {
        db.update({ _id: 'singleNote' }, __assign(__assign({}, noteData), { _id: 'singleNote' }), { upsert: true }, 
        //@ts-ignore
        function (err) {
            if (err) {
                console.error('Error saving note:', err);
                reject(err);
            }
            else {
                console.log('Note saved successfully');
                resolve(true);
            }
        });
    });
}
//di pa kelangan pero lagat na rin natin for the future
function addNote(note) {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        db.insert(note, function (err, newDoc) {
            if (err)
                reject(err);
            else
                resolve(newDoc);
        });
    });
}
function getNote() {
    return new Promise(function (resolve, reject) {
        //@ts-ignore
        db.findOne({ _id: 'singleNote' }, function (err, doc) {
            if (err) {
                reject(err);
            }
            else if (doc) {
                // Return the found note without the _id field
                var _id = doc._id, noteData = __rest(doc, ["_id"]);
                resolve(noteData);
            }
            else {
                // Create a default note if none exists
                var defaultNote_1 = {
                    _id: 'singleNote',
                    note: '',
                    noteColor: '#FFFF88',
                    textColor: '#000000',
                    textContent: '',
                    htmlContent: ''
                };
                // @ts-ignore
                db.insert(defaultNote_1, function (insertErr) {
                    if (insertErr) {
                        console.error('Error creating default note:', insertErr);
                        reject(insertErr);
                    }
                    else {
                        console.log('Default note created:', defaultNote_1);
                        resolve({
                            note: defaultNote_1.note,
                            noteColor: defaultNote_1.noteColor,
                            textColor: defaultNote_1.textColor,
                            textContent: defaultNote_1.textContent,
                            htmlContent: defaultNote_1.htmlContent
                        });
                    }
                });
            }
        });
    });
}
//update ng note
function updateNote(id, updates) {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        db.update({ id: id }, { $set: updates }, {}, function (err, numReplaced) {
            if (err)
                reject(err);
            else
                resolve(numReplaced);
        });
    });
}
//at saka ito for delete note
// di pa kelangan pero lagat na rin natin for the future
function deleteNote(id) {
    return new Promise(function (resolve, reject) {
        // @ts-ignore
        db.remove({ id: id }, {}, function (err, numRemoved) {
            if (err)
                reject(err);
            else
                resolve(numRemoved);
        });
    });
}
module.exports = {
    saveNote: saveNote,
    addNote: addNote,
    getNote: getNote,
    updateNote: updateNote,
    deleteNote: deleteNote
};
