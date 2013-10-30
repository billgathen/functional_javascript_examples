var _ = require('underscore');

// adding .apply to a function call allows you to pass in a new this
// and an array that will be converted to arguments
// and receive the new function for future use
//
// APPLY takes an ARRAY
//
function splat(func) {
  return function(array) {
    return func.apply(null, array); // we don't care about this, so null
  };
}
// Pass an unnamed accumulator to splat that expects 2 args
var addElems = splat(function(x,y) { return x + y });
// Pass 2-elem array which will be converted to args
addElems([1,2]); //=> 3


//
// CALL is a normal FUNCTION CALL (with args), but the first arg is the new this
//
function unsplat(func) {
  return function() { // don't handle args here
    // arguments is not QUITE an array, so convert it to one!
    // the new array will be the first arg to call, not split out like when using .apply
    return func.call(null, _.toArray(arguments)); // handle them here
  };
}
// Pass unnamed joiner to unsplat which expects array
var joinElems = unsplat(function(array){ return array.join(' '); });
// Pass 2 args which will be converted to array
joinElems(1,2); //=> '1 2'


// parseInt converts a string to a number, but always include the base
// as the 2nd argument!
// If can't be cleanly converted, returns NaN ("not a number")
parseInt("123",10); //=> 123


// functional programs extract verbs (OOP tends to focus on nouns)
function fail(thing) { throw new Error(thing); }
function warn(thing) { console.log(["WARNING", thing].join(' ')); }
function note(thing) { console.log(["NOTE", thing].join(' ')); }
// extracting verbs allow new functions to be injected


// Functions are units of behavior
function naiveNth(a, idx) {
  return a[idx];
}
letters = ['a', 'b', 'c'];
naiveNth(letters, 1); //=> "b"
naiveNth({}, 1); //=> undefined
// Extract concept of "indexing"
function isIndexed(data) { return _.isArray(data) || _.isString(data); }
function nth(a, idx) {
  if (! _.isNumber(idx)) fail("Index must be number");
  if (! isIndexed(a)) fail("Object must be index-able");
  if ((idx < 0) || (idx > a.length - 1)) fail("Index out of bounds");
  return a[idx];
}
nth(letters, 1); //=> "b"
// nth({}, 1); //=> Error: Object must be index-able

// now we can re-use nth for a higher-level function
function second(a) {
  return nth(a,1);
}
second([1,2,3]); //=> 2
second("bar"); //=> "a"
// second({}); //=> Error: Object must be index-able


// default sort does a string comparison
[0, -1, -2].sort(); //=> [ -1, -2, 0 ]
// this will do direct comparison, leaving type alone
function compareLessThanOrEqual(x,y) {
  if ( x < y ) return -1;
  if ( y < x ) return 1;
  return 0;
}
[0, -1, -2].sort(compareLessThanOrEqual); //=> [ -2, -1, 0 ]
// completely broken as a standalone conditional
compareLessThanOrEqual(-1,1); //=> -1 (truthy)
compareLessThanOrEqual(1,1);  //=>  0 (falsy)
compareLessThanOrEqual(2,1);  //=>  1 (truthy, and WRONG)
// we could filter by the actual truthy values (-1, 0)
// works, but ugly and not DRY
_.contains([0, -1], compareLessThanOrEqual(1,1)); //=> true
// this works as a conditional, but not a comparator
// functions that return true/false are called predicates
function lessOrEqual(x,y) {
  return x <= y;
}
function greaterOrEqual(x,y) {
  return x >= y;
}
lessOrEqual(1,2); //=> true
// re-implementing the comparator as a higher-order function
// on top of a passed-in predicate is much cleaner
function comparator(pred) {
  return function(x,y) {
    if (pred(x,y))
      return -1;
    else if (pred(y,x))
      return 1;
    else
      return 0;
  };
};
var ascending = comparator(lessOrEqual); // alias for clarity
var descending = comparator(greaterOrEqual); // alias for clarity
[-1, 0, -2].sort(ascending); //=> [ -2, -1, 0 ]
[-1, 0, -2].sort(descending); //=> [ 0, -1, -2 ]


// PARSING CSV
// name, age, hair
// Merble, 35, red
// Bob, 64, blonde
function lameCsv(str) { // extracts to array-of-arrays
  return _.reduce( // accepts 3 args: input, iterator, context
    // input
    str.split("\n"),
    // iterator: accepting context to store results in and current element
    function(table, row) {
      table.push(
        _.map(
          row.split(","), // input
          function(c) { // iterator with element
            return c.trim();
          }
        )
      );
      return table;
    },
    // context (optional container to store output state)
    []
  );
};
peopleTable = lameCsv("name,age,hair\nMerble,35,red\nBob,64,blonde");
//=> [ [ 'name', 'age', 'hair' ],
//     [ 'Merble', '35', 'red' ],
//     [ 'Bob', '64', 'blonde' ] ]
_.rest(peopleTable).sort();
//=> [ [ 'Bob', '64', 'blonde' ],
//     [ 'Merble', '35', 'red' ] ]

// since we know the data structure, we can create helper functions
function selectNames(table)     { return _.rest(_.map(table, _.first)); }
selectNames(peopleTable);     //=> [ 'Merble', 'Bob' ]
function selectAges(table)      { return _.rest(_.map(table, second)); } // reuse!
selectAges(peopleTable);      //=> [ '35', '64' ]
function selectHairColor(table) { return _.rest(_.map(table, _.last)); }
selectHairColor(peopleTable); //=> [ 'red', 'blonde' ]
var mergeResults = _.zip; // alias for clarity
mergeResults(
  selectNames(peopleTable),
  selectAges(peopleTable)
); //=> [ [ 'Merble', '35' ], [ 'Bob', '64' ] ]


function existy(x) { return x != null }; // != instead of !== handles both null and undefined
function truthy(x) { return (x !== false) && existy(x) }; // separates false from non-existent
// what if we want to execute something only if a conditional is true?
function doWhen(pred, func) { // whenDo more readable to me: when X, do Y
  if (truthy(pred))
    return func();
  else
    return undefined; // Avdi would HATE this
}
function executeIfHasField(obj, name) {
  return doWhen(
    existy(obj[name]),
    function() {
      return _.result(obj, name); // execute if function, otherwise return
    }
  );
}
var cannon = {
  name: "Old Boomer",
  fire: function() { return "boom"; }
}
executeIfHasField(cannon,  "fire");     //=> "boom"
executeIfHasField(cannon,  "name");     //=> "Old Boomer"
executeIfHasField([1,2,3], "reverse");  //=> [3, 2, 1]
executeIfHasField(cannon,  "empty");    //=> undefined


// Google Closure compiler is an amazing piece of engineering
// that compiles JavaScript into highly optimized JavaScript


// First-class functions can be:
// - stored in a variable
var fortytwo = function() { return 42; };
// - stored in an array slot
var fortytwos = [ 42, fortytwo ];
// - stored in an object field
var fortytwos = { number: 42, func: fortytwos };
// - created on the fly. Note the immediate execution!
42 + (function() { return 42; })(); //=> 84
// - passed to a function
function weirdAdd(n, f) { return n + f(); }
weirdAdd(42, fortytwo); //=> 84
// - returned from a function
function getFuncFortyTwo() { return fortytwo; }
ft = getFuncFortyTwo()
ft(); //=> 42

// A "higher-order" function accepts and/or returns a function
var stateTax = function(amt) { return amt * 0.06; }
var withTax = function(taxOn) { return function(amt) { return amt + taxOn(amt); }; };
var withStateTax = withTax(stateTax);
withStateTax(1.00); //=> 1.06


// 99 Bottles of Beer on the Wall, functional-style
function lyricSegment(n) {
  return _.chain([]) // applies a string of calls to the supplied context
    .push(n + " bottles of beer on the wall")
    .push(n + " bottles of beer")
    .push("Take one down, pass it around")
    .tap(function(lyrics) { // grab context as "lyrics" to manipulate directly
      if ( n > 1 )
        lyrics.push((n-1) + " bottles of beer on the wall");
      else
        lyrics.push("No more bottles of beer on the wall");
    })
    .value(); // return value of context
}
function song(start, end, lyricGen) { // accept function to execute as 3rd arg
  return _.reduce( // reduce to an array of lyric lines
    _.range(start,end,-1), // iterate over a range, descending
    function(lyrics, n) {
      return lyrics.concat(lyricGen(n));
    },
    [] // context: passed in as first arg to iterator
  );
}
song(2,0,lyricSegment); // generates 2 verses


// Applicative programming means function A calling function B
// when function B was passed in as an argument (Higher-Order Functions)
// Canonical examples: map, reduce, filter
// Each accept a "processing" function that makes them run
var nums = [1,2,3,4,5];

function doubleAll(array) {
  return _.map( array, function(ele) { return ele * 2; } );
}
doubleAll(nums); //=> [ 2, 4, 6, 8, 10 ]

function average(array) {
  var sum = _.reduce(array, function(memo,b) { return memo + b; });
  return sum / _.size(array);
}
average(nums); //=> 3

function onlyEven(array) {
  return _.filter(array, function(n) { return n % 2 == 0; });
}
onlyEven(nums); //=> [ 2, 4 ]

// The identity function returns its argument
var data = { a: 1, b: 2 };
_.map(data, _.identity); //=> [ 1, 2 ]
_.map(data, function(v,k) { return [ k, v ]; }); //=> [ [ 'a', 1 ], [ 'b', 2 ] ]
// map passes value, key, collection to iterator: accept whichever you need


// reduceRight iterates over collection back-to-front: why is that needed here?
function allOf() {
  return _.reduceRight(
    arguments,
    function(current_truth, f) { return current_truth && f(); },
    true
  );
}
function anyOf() {
  return _.reduceRight(
    arguments,
    function(current_truth, f) { return current_truth || f(); },
    false
  );
}
function T() { return true;  }
function F() { return false; }
allOf(); //=> true
allOf(T, T); //=> true
allOf(T, T, F); //=> false
anyOf(); //=> false
anyOf(F, F); //=> false
anyOf(T, T, F); //=> true

_.find(['a', 'b', 3, 'd'], _.isNumber); //=> 3
// Lots of available predicates:
// isEqual
// isEmpty
// isElement
// isArray
// isObject
// isArguments
// isFunction
// isString
// isNumber
// isFinite
// isBoolean
// isDate
// isRegExp
// isNaN
// isNull
// isUndefined

function complement(pred) {
  return function() {
    return ! pred.apply(null, _.toArray(arguments));
  };
}
_.filter([1, 2, 'c', 4], complement(_.isNumber)); //=> [ 'c' ]


var albums = [
  { name: "OK Computer", artist: "Radiohead" },
  { name: "Random Access Memories", artist: "Daft Punk" },
  { name: "In Rainbows", artist: "Radiohead" }
];
_.sortBy(albums, function(a) { return a.name });
_.groupBy(albums, function(a) { return a.artist });
_.countBy(albums, function(a) { return a.artist });


// flatten a list into a single array
// NOTE: the first arg you pass must be array-like
//  the rest don't
function cat() {
  var head = _.first(arguments); // grab an argument
  if (existy(head)) // if you found one...
    // concat, using apply to maintain "this" as head
    // and convert the remainder of arguments array
    // back to the actual args concat expects
    return head.concat.apply(head, _.rest(arguments));
  else
    return [];
}
cat([1,2],[3,4]); //=> [1, 2, 3, 4]


// Using apply to pass along arguments works like
// the *args -> &args trick in Ruby
function dynamicCalculator() { // don't deal with args here: allows dynamic arg list
  var oper = _.head(arguments); // grab first arg
  if (oper === "add")
    // pass the rest through, using apply to convert them back
    return adder.apply(null, _.rest(arguments));
  else if (oper === "subtract")
    return subtracter.apply(null, _.rest(arguments));
  else
    return "Unknown operation " + oper;
}
function adder()      { return _.reduce(arguments, function(a,b) { return a + b; }); }
function subtracter() { return _.reduce(arguments, function(a,b) { return a - b; }); }
dynamicCalculator("add", 1, 2, 3); //=> 6
dynamicCalculator("subtract", 1, 2, 3); //=> -4


// push an arg onto the front of an array
function construct(head, tail) {
  // make sure both head and tail behave like arrays
  return cat([head], _.toArray(tail));
}
construct(42, [1,2,3]); //=> [42, 1, 2, 3]


// map a dataset to another before concatenating
function mapcat(func, coll) {
  return cat.apply(null, _.map(coll, func));
}
mapcat(
    // tack a comma onto each element
    function(e) { return construct(e, [","]); },
    [1,2,3]
); //=> [ 1, ',', 2, ',', 3, ',' ]

// (note the trailing comma: don't want that)
function butLast(coll) {
  return _.toArray(coll).slice(0,-1); // lop off last element
}
function interpose(delim, coll) {
  return butLast( // remove trailing delim
      mapcat(
        function(e) { return construct(e, [delim]); },
        coll
      )
    );
}
interpose(',', [1,2,3]); //=> [ 1, ',', 2, ',', 3 ]
interpose(',', [1,2,3]).join(''); //=> 1,2,3


// deconstructing objects into arrays permits sequential actions
var zombie = { name: 'Bub', movie: 'Day of the Dead' };
_.keys(zombie); //=> [ 'name', 'movie' ]
_.values(zombie); //=> [ 'Bub', 'Day of the Dead' ]
_.pluck([zombie], 'movie'); //=> [ 'Day of the Dead' ]
_.pairs(zombie); //=> [ [ 'name', 'Bub' ], [ 'movie', 'Day of the Dead' ] ]
// we can convert it back, too
_.object(_.pairs(zombie)); //=> { name: 'Bub', movie: 'Day of the Dead' }
// maybe tweaking as we go...
_.object(
  _.map(
    _.pairs(zombie),
    function(pair) {
      return [pair[0].toUpperCase(), pair[1]];
    }
  )
); //=> { NAME: 'Bub', MOVIE: 'Day of the Dead' }
// invert flips keys/values
// NOTE: keys are always strings... they will be converted if not
_.invert(zombie); //=> { Bub: 'name', 'Day of the Dead': 'movie' }


// Underscore supports default values for objects
var employee = { name: 'Bill', token: '12345', password: 'tiger' };
_.defaults(employee, { name: 'unknown', title: 'not supplied' });
// Also, filtering objects by key
var safe_info = _.omit(employee, 'token', 'password'); //=> { name: 'Bill', title: 'not supplied' }
var creds = _.pick(employee, 'token', 'password'); //=> { token: '12345', password: 'tiger' }
// Also function-based selectors
var all = [
  { name: 'Bill', active: true },
  { name: 'Keith', active: false },
  { name: 'Pete', active: true }
];
_.findWhere(all, { active: true }); //=> { name: 'Bill', active: true }
_.where(all, { active: true }); //=> [ { name: 'Bill', active: true }, { name: 'Pete', active: true } ]


var library = [
  { title: 'SICP', isbn: '0262010771', ed: 1 },
  { title: 'SICP', isbn: '0262510871', ed: 2 },
  { title: 'The Joy of Clojure', isbn: '1935182641', ed: 1 }
];
// Whoops: loses the "table-ness" (i.e., the columns)
_.pluck(library, 'title'); //=> [ 'SICP', 'SICP', 'The Joy of Clojure' ]

// NOTE: no clue if this means project you work on or project like projector
// I think the latter... terrible name, anyway
function project(table, keys) {
  return _.map(
    table,
    function(obj) {
      // use pick not pluck to get key/value pairs
      // use construct to prepend object onto key list
      // for _.pick, which expects object then list of fields
      return _.pick.apply(null, construct(obj, keys));
    }
  );
}
var editionResults = project(library,[ 'title', 'isbn' ]); // filter it
//=> [ { title: 'SICP', isbn: '0262010771' },
//     { title: 'SICP', isbn: '0262510871' },
//     { title: 'The Joy of Clojure', isbn: '1935182641' } ]
var isbnResults = project(editionResults,[ 'isbn' ]); // filter results
//=> [ { isbn: '0262010771' },
//     { isbn: '0262510871' },
//     { isbn: '1935182641' } ]


// Functional programmers think deeply about their data,
// the transformations occurring on it,
// and the hand-over formats between the layers of their applications


// Rename keys based on a given map
function rename(obj, newNames) {
  return _.reduce(
    newNames, // for each element of the renaming map...
    function(memo, new_name, old_name) {  // memo object, value, key (or index, if array)
      if (_.has(obj, old_name)) {         // if original object has old key...
        memo[new_name] = obj[old_name];   // add new key with old value to memo object
        return memo;                      // and return augmented memo object
      }
      else
        return memo; 
    },
    // start with temporary "memoization" object without all the old fields
    _.omit.apply(null, construct(obj, _.keys(newNames)))
  );
}
rename(library[0], { ed: 'edition' }); //=> { title: 'SICP', isbn: '0262010771', edition: 1 }
// ...then wrap in a map function to build SQL-like 'as' logic
function as(table, newNames) {
  return _.map(
    table,
    function(obj) { return rename(obj, newNames); }
  );
}
as(library, { ed: 'edition' });
//=> [ { title: 'SICP', isbn: '0262010771', edition: 1 },
//     { title: 'SICP', isbn: '0262510871', edition: 2 },
//     { title: 'The Joy of Clojure', isbn: '1935182641', edition: 1 } ]
project(as(library, { ed: 'edition' }), ['edition']);
//=> [ { edition: 1 }, { edition: 2 }, { edition: 1 } ]

// now all that's left is the where clause...
function restrict(table, pred) {
  return _.reduce(
    table,
    function(tmpTable, obj) {
      if (truthy(pred(obj)))
        return tmpTable;
      else
        // strip failed object from temporary table
        return _.without(tmpTable, obj);
    },
    table
  );
}
restrict(library, function(book) { return book.ed > 1; });
//=> [ { title: 'SICP', isbn: '0262510871', ed: 2 } ]
// CHAIN ALL THE THINGS!
restrict(
  project(
    as(
      library,
      { ed: 'edition' }
    ),
    [ 'title', 'isbn', 'edition' ]
  ),
  function(book) { return book.edition > 1; }
); //=> [ { title: 'SICP', isbn: '0262510871', edition: 2 } ]

// Restrict, project and as work against a simple array of objects.
// This is data thinking.


// CHAPTER THREE
// Binding is a synonym for "assigning": a = 1 binds the value 1 to the variable a


// Lexical scoping: the closest definition of a variable gets precedence
// JS has "block-level" scoping
myLocation = "global";
global_value = myLocation;
function myFunc() {
  var myLocation = "function"; // shadows global
  function_value = myLocation;
  return _.map([1,2,3], function(e) {
    var myLocation = "map"; // shadows function
    map_value = myLocation;
  });
};
myFunc();
[ global_value, function_value, map_value ]; //=> [ 'global', 'function', 'map' ]

// Dynamic scoping is built on the idea of a global table of named values
var globals = {};
function makeBindFunc(resolver) {
  return function(k, v) {
    var stack = globals[k] || []; // find or create on globals, which is in the global scope
    globals[k] = resolver(stack, v); // resolver performs some action on the stack with the value
    return globals; // Not sure why we return globals: it's been globally-mutated...
  };
}
// Lexically-scoped variables are little stacks: we can use this to "stack" the values
// Pass me a stack (aka variable) and a value, and I'll store the value on top of the stack
var stackBinder = makeBindFunc(function(stack, v) {
  stack.push(v);
  return stack;
});
// Pass me a stack (aka variable) and I'll remove the top element from the stack
// Use this when you leave a block and that value needs to disappear, exposing the next
var stackUnbinder = makeBindFunc(function(stack) {
  stack.pop();
  return stack;
});
// We need a function to look up the current (top-most) value for the variable
var dynamicLookup = function(k) {
  var slot = globals[k] || [];
  return _.last(slot);
};
// In use...
stackBinder('my_var','my_val');
dynamicLookup('my_var'); //=> 'my_val'
stackBinder('my_var','my_new_val');
dynamicLookup('my_var'); //=> 'my_new_val'
stackUnbinder('my_var');
dynamicLookup('my_var'); //=> 'my_val'


// THE DYNAMIC THIS
function globalThis() { return this; }
globalThis(); //=> the global object (in a browser, Window)
globalThis.call('barnabas'); //=> 'barnabas'
globalThis.call('orsulak'); //=> 'orsulak'
// Underscore lets you permanently bind a specific this
var nopeThis = _.bind(globalThis, 'nope');
nopeThis.call('wat'); //=> 'nope'
var target =  { name: 'the right value',
                aux: function() { return this.name; },
                act: function() { return this.aux(); }
              };
// have to comment this, because the usage poisons it before _.bindAll can work!
// target.act.call('wat'); //=> TypeError: Object wat has no method 'aux'
// to lock down this for selected methods only, use _.bindAll
_.bindAll(target, 'aux', 'act');
target.act.call('wat'); //=> 'the right value'


// All var declarations are implicitly moved to the top of the function.
// This is called "hoisting".
function strangeIdentity(n) {
  for( var i=0; i<n; i++);
  return i;
}
// ...does not return an error even though it looks like i is scoped to the for loop
// internally, it's converted to this:
function strangeIdentity(n) {
  var i;
  for( i=0; i<n; i++ );
  return i;
}
// this means that any variable declared in a function is visible
// everywhere in the function and is part of the closures
function strangerIdentity(n) {
  // simulating function scope using this
  for( this['i'] = 0; this['i']<n; this['i']++ );
  return this['i'];
}
// but for a bare function, this is the global object!
// to avoid polluting the global namespace, we can use call
// and pass it a scratch object
strangerIdentity.call({}, 42); //=> 42
// if we want access to the contents of the global scope
// without modifying it, we can clone it first
function f() {
  this['a'] = 200;
  return this['a'] + this['b'];
}
var globals = {'b': 2}; // simulated global object
f.call(_.clone(globals)); //=> 202
// and the original is untouched
result = globals; //=> {'b': 2}

// Closures are functions which capture values near where they are born,
// even after the scope that created those variables has completed
function whatWasTheLocal() {
  var CAPTURED = "Oh hai";

  return function() {
    return "The local was: " + CAPTURED;
  };
}
var reportLocal = whatWasTheLocal();
reportLocal(); //=> "The local was: Oh hai"
// arguments are variables, too
function createScaleFunction(FACTOR) {
  return function(v) {
    return _.map(
      v,
      function(n) {
        return (n * FACTOR);
      }
    );
  };
}
var scale10 = createScaleFunction(10);
scale10([1,2,3]); //=> [10,20,30]
// simulating a closure using the passed-in this from before
function createWeirdScaleFunction(FACTOR) {
  return function(v) {
    this['FACTOR'] = FACTOR;
    var captures = this;

    return _.map(
      v,
      function(n) {
        return (n * this['FACTOR']);
      },
      captures
    );
  };
}
var scale10 = createWeirdScaleFunction(10);
scale10([5,6,7]); //=> [50,60,70]

function plucker(FIELD) {
  return function(obj) {
    return (obj && obj[FIELD]);
  };
}
var book = { title: 'Infinite Jest', author: 'DFW' };
var getTitle = plucker('title');
getTitle(book); //=> 'Infinite Jest'


// CHAPTER 4: Higher-Order Functions
// More flexible "max" function: extracts value and compares for collection
function finder(valueFunc, bestFunc, coll) {
  return _.reduce(
    coll,
    function(best, current) {
      // Extract the value you care about (so it will handle objects)
      var bestValue = valueFunc(best);
      var currentValue = valueFunc(current);

      // Determine "best" value and return its associated object
      return (bestValue === bestFunc(bestValue, currentValue)) ? best : current;
    }
  );
}
// _.identity just returns what it was passed: a no-op
finder(_.identity, Math.max, [1,2,3,4,5]); //=> 5
var people = [{ name: 'Fred', age: 65 }, { name: 'Lucy', age: 36 }];
finder(plucker('age'), Math.max, people);
// By off-loading more of the load to the passed-in function,
// we can slim finder down to this:
function best(func, coll) {
  return _.reduce(
    coll,
    function(x,y) { return func(x,y) ? x : y }
  );
}
best(function(x,y) { return x > y; }, [1,2,3,4,5]); //=> 5


// USE FUNCTIONS, NOT VALUES
// ok, but only does one thing
function repeat(times, VALUE) {
  return _.map(
    _.range(times),
    function() { return VALUE; }
  );
}
repeat(4, 'major'); //=> [ 'major', 'major', 'major', 'major' ]
// better, because we can repeat anything
function repeatedly(times, func) {
  return _.map(_.range(times), func);
}
repeatedly(3, function() { return Math.floor((Math.random()*10)+1); });
//=> ( 3 random numbers from 1 to 10 )
repeatedly(4, function() { return 'major'; });
//=> [ 'major', 'major', 'major', 'major' ]
// better still, because we don't need a fixed number of iterations
function iterateUntil(func, check, init) {
  var ret = [];             // store context
  var result = func(init);  // do operation once

  while (check(result)) {   // if value doesn't fail
    ret.push(result);       // store the value
    result = func(result);  // do the operation again
  }

  return ret;
}
iterateUntil(function(n) { return n + n; },    // do this thing
             function(n) { return n <= 1024 }, // until this fails
             1);                               // starting here
//=> [ 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024 ]
iterateUntil(function(n) { return Math.floor((Math.random()*10)+1); },
             function(n) { return n <= 5; },
             0);
//=> array of random numbers until we generate one greater than 5

// A function that returns a constant is common in functional programming
// and is often called k. We'll implement it as "always" for clarity
function always(VALUE) {
  return function() {
    return VALUE;
  };
}
var f = always(function(){});   // return THE SAME empty function
result = function(){} === function(){};  //=> false (every created function is a unique instance)
f() === f();                    //=> true (same function returned every time)
var g = always(function(){});
f() === g();                    //=> false (every run of always is a unique instance)
g() === g();                    //=> true (same function returned every time)
repeatedly(4, always('Odelay!'));//=> [ 'Odelay!', 'Odelay!', 'Odelay!', 'Odelay!' ]

// Take a method and return a function that will invoke that method on any object given
function invoker(NAME, METHOD) {
  return function(target /* args */) { // target object, followed by any args to METHOD
    if (!existy(target)) fail('Must provide a target');

    var targetMethod = target[NAME]; // grab method with supplied name from target
    var args = _.rest(arguments);

    return doWhen(
      // if we got something in targetMethod and it matches the actual method passed in
      (existy(targetMethod) && METHOD === targetMethod),
      function() {
        return targetMethod.apply(target, args); // could also have used METHOD.apply
      }
    );
  };
}
// supply the name of the method and the actual method to use (for verification)
var rev = invoker('reverse', Array.prototype.reverse);
// _.map passes each element as an arg to rev
_.map([[1,2,3],[2,3,4]], rev); //=> [ [ 3, 2, 1 ], [ 4, 3, 2 ] ]
// this doesn't work because String doesn't have Array.prototype.reverse
_.map(["first","second"], rev); //=> [ undefined, undefined ]
// but this works
var upcase = invoker('toUpperCase', String.prototype.toUpperCase);
_.map(["first","second"], upcase); //=> [ 'FIRST', 'SECOND' ]


function uniqueString(len) {
  return Math.random().toString(36).substr(2, len);
}
uniqueString(10); //=> Random 10-character string
function uniqueString(prefix) {
  return [prefix, new Date().getTime()].join('');
}
uniqueString('argento'); //=> argento1378527867869
function makeUniqueStringFunction(start) {
  var COUNTER = start;

  return function(prefix) {
    return [prefix, COUNTER++].join('');
  };
}
var uniqueString = makeUniqueStringFunction(0);
uniqueString('dari'); //=> 'dari0'
uniqueString('dari'); //=> 'dari1'
// the problem with this is the COUNTER variable for storing state
// functions that rely only on their arguments have referential transparency
// with this, the same arg returns different values depending on
// how many times it's been called
// Functional programs avoid mutating state to eliminate this complexity


// Guarding against non-existence
var nums = [1,2,3,null,5];
_.reduce(nums, function(tot, n) { return tot * n; }); //=> 0
// A function that takes a function as an argument (plus any extras)
// and returns a function that calls the function given.
// If any args are null or undefined, use the default value instead
function fnull(func /*, defaults */) {  // pass func and default args
  var defaults = _.rest(arguments);     // keep defaults for later

  return function(/* args */) { // takes actual arguments
    var args = _.map(           // process arguments
      arguments,
      function(e, i) {          // argument and index of arg
        return existy(e) ? e : defaults[i]; // replace with default if missing
      }
    );

    return func.apply(null, args);  // call func with clean arg list
  };
}
var safeMult = fnull(function(total, n) { return total * n; }, 1, 1);
_.reduce(nums, safeMult); //=> 30


// Echo results, if they exist
if (typeof r !== "undefined")
  console.log(r);
