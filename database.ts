const fs = require('fs');
const Datastore = require('nedb');
const path2 = require('path');
const { app: elect } = require('electron');

const dbDir = elect.getPath('userData'); 
const dbPath = path2.join(dbDir, 'stickier-notes.db');


if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true }); 
  console.log('Database directory created:', dbDir);
} else {
  console.log('Database directory already exists:', dbDir);
}

console.log('Database Path:', dbPath);

//initialize natin database
const db = new Datastore({ filename: dbPath, autoload: true });

function saveNote(noteData: {
  note: string;
  noteColor: string;
  textColor: string;
  textContent: string;
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
          textContent: ''
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
              textContent: defaultNote.textContent
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