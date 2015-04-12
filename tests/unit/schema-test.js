import Schema from 'ember-cli-mirage/orm/schema';
import Model from 'ember-cli-mirage/orm/model';
import Db from 'ember-cli-mirage/orm/db';
import Relation from 'ember-cli-mirage/orm/relation';

module('mirage:schema');

test('it can be instantiated', function(assert) {
  var schema = new Schema(new Db());
  assert.ok(schema);
});

test('it cannot be instantiated without a db', function(assert) {
  assert.throws(function() {
    var schema = new Schema();
  }, /requires a db/);
});

module('mirage:schema#new');

test('it can make new (unsaved) registered models', function(assert) {
  var schema = new Schema(new Db());

  var User = Model.extend();
  schema.register('user', User);

  var user = schema.user.new({name: 'Link'});

  assert.ok(user instanceof User);
  assert.deepEqual(user.attrs, {name: 'Link'});
});

test('it cannot make new models that havent been registered', function(assert) {
  var schema = new Schema(new Db());

  assert.throws(function() {
    schema.user.new({name: 'Link'});
  });
});

module('mirage:schema#create');

test('it can create registered models', function(assert) {
  var schema = new Schema(new Db());

  var User = Model.extend();
  schema.register('user', User);

  var user = schema.user.create({name: 'Link'});

  assert.ok(user instanceof Model);
  assert.ok(user instanceof User);
  assert.deepEqual(user.attrs, {id: 1, name: 'Link'});
});

test('it cannot create models that havent been registered', function(assert) {
  var schema = new Schema(new Db());

  assert.throws(function() {
    schema.user.create({name: 'Link'});
  });
});

module('mirage:schema#all');

test('it can return all models', function(assert) {
  var db = new Db();
  db.createCollection('users');
  db.users.insert([{id: 1, name: 'Link'}, {id: 2, name: 'Zelda'}]);
  var schema = new Schema(db);

  var User = Model.extend();
  schema.register('user', User);

  var users = schema.user.all();

  assert.ok(users instanceof Relation, 'it returns a relation');
  assert.ok(users[0] instanceof User, 'each member of the relation is a model');
  assert.equal(users.length, 2);
  assert.deepEqual(users[1].attrs, {id: 2, name: 'Zelda'});
});

test('it returns an empty array when no models exist', function(assert) {
  var db = new Db();
  db.createCollection('users');
  var schema = new Schema(db);

  var User = Model.extend();
  schema.register('user', User);

  var users = schema.user.all();

  assert.ok(users instanceof Relation, 'it returns a relation');
  assert.equal(users.length, 0);
});

var schema;
var User = Model.extend();
module('mirage:schema#find', {
  beforeEach: function() {
    var db = new Db();
    db.createCollection('users');
    db.users.insert([{id: 1, name: 'Link'}, {id: 2, name: 'Zelda'}]);
    schema = new Schema(db);

    schema.register('user', User);
  }
});

test('it can find a model by id', function(assert) {
  var zelda = schema.user.find(2);

  assert.ok(zelda instanceof User);
  assert.deepEqual(zelda.attrs, {id: 2, name: 'Zelda'});
});

test('it returns null if no model is found for an id', function(assert) {
  var user = schema.user.find(4);

  assert.equal(user, null);
});

test('it can find multiple models by ids', function(assert) {
  var users = schema.user.find([1, 2]);

  assert.ok(users instanceof Relation, 'it returns a relation');
  assert.ok(users[0] instanceof User);
  assert.equal(users.length, 2);
  assert.deepEqual(users[1].attrs, {id: 2, name: 'Zelda'});
});

test('it returns an empty relation if no models are found for an array of ids', function(assert) {
  var users = schema.user.find([5, 6]);

  assert.ok(users instanceof Relation, 'it returns a relation');
  assert.equal(users.length, 0);
});

test('it throws when trying to find models from a db collection that doesnt exist', function(assert) {
  var db = new Db();
  schema = new Schema(db);

  schema.register('user', User);

  assert.throws(function() {
    var users = schema.user.find(1);
  }, /collection doesn't exist/);
});

var schema;
var User = Model.extend();
module('mirage:schema#where', {
  beforeEach: function() {
    var db = new Db();
    db.createCollection('users');
    db.users.insert([
      {id: 1, name: 'Link', good: true},
      {id: 2, name: 'Zelda', good: true},
      {id: 3, name: 'Ganon', good: false}
    ]);
    schema = new Schema(db);

    schema.register('user', User);
  }
});

test('it returns models that match a query with where', function(assert) {
  var users = schema.user.where({good: false});

  assert.ok(users instanceof Relation, 'it returns a relation');
  assert.equal(users.length, 1);
  assert.ok(users[0] instanceof User);
  assert.deepEqual(users[0].attrs, {id: 3, name: 'Ganon', good: false});
});

test('it returns an empty relation if no models match a query', function(assert) {
  var users = schema.user.where({name: 'Link', good: false});

  assert.ok(users instanceof Relation, 'it returns a relation');
  assert.equal(users.length, 0);
});

test('it throws when trying to find models from a db collection that doesnt exist', function(assert) {
  var db = new Db();
  schema = new Schema(db);

  schema.register('user', User);

  assert.throws(function() {
    var users = schema.user.where({name: 'Link'});
  }, /collection doesn't exist/);
});