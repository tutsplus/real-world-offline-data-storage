// check if the indexedDB is supported
if (!window.indexedDB) {
	alert('IndexedDB is not supported!');
}

// variable which will hold the database connection
var db;

// open the database
var request = indexedDB.open('album', 1);

request.onerror = function (e) {
	console.log(e);
};

// this will fire when version of the database changes
request.onupgradeneeded = function (e) {
	// e.target.result holds the connection to database
	db = e.target.result;
	
	// create a store to hold the data
	var objectStore = db.createObjectStore('cds', { keyPath: 'id', autoIncrement: true });
	
	// create an index to search cds by title
	objectStore.createIndex('title', 'title', { unique: true });
	
	// create an index to search cds by band
	objectStore.createIndex('band', 'band', { unique: false });
};

request.onsuccess = function (e) {
	if (!db) db = e.target.result;
	
	var transaction = db.transaction([ 'cds' ]); // no flag since we are only reading
	var store = transaction.objectStore('cds');
	// open a cursor, which will get all the items from database
	store.openCursor().onsuccess = function (e) {
		var cursor = e.target.result;
		if (cursor) {
			var value = cursor.value;
			$('#albums-list tbody').append('<tr><td><a id="'+ value.id +'" class="remove-album" href="javascript:null">[x]</a> '+ value.title +'</td><td>'+ value.band +'</td><td>'+ value.genre +'</td><td>'+ value.year +'</td></tr>');

			// move to the next item in the cursor
			cursor.continue();
		}
	};
}

$(function () {
	$('input').on('keyup', function () {
		if (window.localStorage) {
			localStorage.setItem($(this).attr('id'), $(this).val());
		}
	});
	
	$('#album-add').on('click', function () {
		// create the transaction
		var transaction = db.transaction([ 'cds' ], 'readwrite');
		transaction.onerror = function (e) {
			console.log(e);
		};
		var value = {
			title: $('#album-title').val(),
			band: $('#album-band').val(),
			genre: $('#album-genre').val(),
			year: $('#album-year').val()
		};
		// add the album to the store
		var request = transaction.objectStore('cds').add(value);
		request.onsuccess = function (e) {
			$('#albums-list tbody').append('<tr><td><a id="'+ e.target.result +'" class="remove-album" href="javascript:null">[x]</a> '+ value.title +'</td><td>'+ value.band +'</td><td>'+ value.genre +'</td><td>'+ value.year +'</td></tr>');
			
			// remove backed-up values from localStorage
			$('input').each(function () {
				localStorage.removeItem($(this).attr('id'));
				$(this).val('');
			});
		};
	});
	
	$('table').on('click', '.remove-album', function () {
		// closure to preserve 'this'
		(function (it) {
			var transaction = db.transaction([ 'cds' ], 'readwrite');
			var request = transaction.objectStore('cds').delete(+$(it).attr('id'));
			request.onsuccess = function () {
				$(it).parents('tr').remove();
			}
		}(this));
	});
	
	$('input').each(function () {
		var val = localStorage.getItem($(this).attr('id'));
		if (val) {
			$(this).val(val);
		}
	});
});