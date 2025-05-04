const fs = require('fs');
const path2 = require('path');
const { app: elect } = require('electron');

// Safely import nedb with fallbacks
let Datastore;
try {
  // First try the standard import
  Datastore = require('nedb');
} catch (error) {
  try {
    // If standard import fails, try from resources path for packaged app
    const appPath = elect.getAppPath();
    const resourcesPath = process.resourcesPath;
    console.log('App path:', appPath);
    console.log('Resources path:', resourcesPath);
    
    // Try different possible locations for the nedb module
    const possiblePaths = [
      path2.join(resourcesPath, 'node_modules', 'nedb'),
      path2.join(appPath, 'node_modules', 'nedb'),
      path2.join(resourcesPath, 'app.asar.unpacked', 'node_modules', 'nedb'),
      path2.join(path2.dirname(appPath), 'node_modules', 'nedb')
    ];
    
    console.log('Trying to load nedb from possible paths:', possiblePaths);
    
    let loaded = false;
    for (const modulePath of possiblePaths) {
      try {
        if (fs.existsSync(path2.join(modulePath, 'index.js'))) {
          console.log('Found nedb at:', modulePath);
          Datastore = require(modulePath);
          loaded = true;
          break;
        }
      } catch (err) {
        console.log(`Failed to load from ${modulePath}:`, err.message);
      }
    }
    
    if (!loaded) {
      throw new Error('Could not find nedb module in any location');
    }
  } catch (innerError) {
    console.error('Failed to load nedb module:', innerError);
    throw innerError;
  }
}

const dbDir = elect.getPath('userData'); 
const dbPath = path2.join(dbDir, 'stickier-notes.db');

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true }); 
  console.log('Database directory created:', dbDir);
} else {
  console.log('Database directory already exists:', dbDir);
}

console.log('Database Path:', dbPath);

// Initialize database
const db = new Datastore({ filename: dbPath, autoload: true });

function saveNote(noteData: {
  note: string;
  noteColor: string;
  textColor: string;
  textContent: string;
  htmlContent?: string; // Add optional htmlContent field
}) {
  console.log('Saving note:', noteData);
  return new Promise((resolve, reject) => {
    db.update(
      { _id: 'singleNote' },
      { ...noteData, _id: 'singleNote' },
      { upsert: true },
    //@ts-ignore
      (err) => {
        if (err) {
          console.error('Error saving note:', err);
          reject(err);
        } else {
          console.log('Note saved successfully');
          resolve(true);
        }
      }
    );
  });
}

//di pa kelangan pero lagat na rin natin for the future
function addNote(note: { id: string; title: string; content: string; createdAt: string }) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    db.insert(note, (err, newDoc) => {
      if (err) reject(err);
      else resolve(newDoc);
    });
  });
}

function getNote() {
  return new Promise((resolve, reject) => {
    //@ts-ignore
    db.findOne({ _id: 'singleNote' }, (err, doc) => {
      if (err) {
        reject(err);
      } else if (doc) {
        // Return the found note without the _id field
        const { _id, ...noteData } = doc;
        resolve(noteData);
      } else {
        // Create a default note if none exists
        const defaultNote = {
          _id: 'singleNote',
          note: '',
          noteColor: '#FFFF88',
          textColor: '#000000',
          textContent: '',
          htmlContent: ''
        };
        // @ts-ignore
        db.insert(defaultNote, (insertErr) => {
          if (insertErr) {
            console.error('Error creating default note:', insertErr);
            reject(insertErr);
          } else {
            console.log('Default note created:', defaultNote);
            resolve({
              note: defaultNote.note,
              noteColor: defaultNote.noteColor,
              textColor: defaultNote.textColor,
              textContent: defaultNote.textContent,
              htmlContent: defaultNote.htmlContent
            });
          }
        });
      }
    });
  });
}

//update ng note
function updateNote(id: string, updates: Partial<{ title: string; content: string }>) {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    db.update({ id }, { $set: updates }, {}, (err, numReplaced) => {
      if (err) reject(err);
      else resolve(numReplaced);
    });
  });
}

//at saka ito for delete note
// di pa kelangan pero lagat na rin natin for the future
function deleteNote(id: string) {
  return new Promise((resolve, reject) => {
   
    // @ts-ignore
    db.remove({ id }, {}, (err, numRemoved) => {
      if (err) reject(err);
      else resolve(numRemoved);
    });
  });
}

module.exports = {
  saveNote,
  addNote,
  getNote,
  updateNote,
  deleteNote
};