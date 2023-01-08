import request from "supertest";
import {users} from './index';

const app = 'http://localhost:3000'
describe('GET api/users', () => {
  it('should return an empty array', (done) => {
    request('http://localhost:3000').get('/api/users')
      .expect(200)
      .expect(users, done);
  });
});
describe('POST api/users', () => {
  it('should create a new object', (done) => {
    request(app)
      .post('/api/users')
      .send({
        username: 'Alice',
        age: 30,
        hobbies: 'running,reading'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('username', 'Alice');
        expect(res.body).toHaveProperty('age', 30);
        expect(res.body).toHaveProperty('hobbies', 'running,reading');
      })
      .end(done);
  });
});


describe('GET api/users/:userId', () => {
  it('should return the created object', async () => {
    // @ts-ignore
    const firstUser = await request('http://localhost:3000').get('/api/users')
    request(app)
      .get('/api/users/' + firstUser.body[0].id)
      .expect(200)
      .expect({
        username: 'Alice',
        age: 30,
        hobbies: ['running', 'reading']
      })
  });
});


describe('PUT api/users/:userId', () => {
  it('should update the created object', async () => {
    const firstUser = await request('http://localhost:3000').get('/api/users')
    request(app)
      .put('/api/users/' + firstUser.body[0].id)
      .send({
        username: 'Bob',
        age: 35,
        hobbies: ['swimming', 'cooking']
      })
      .expect(200)
      .expect({
        id: firstUser.body[0].id,
        username: 'Bob',
        age: 35,
        hobbies: ['swimming', 'cooking']
      })
  });
});

describe('DELETE api/users/:userId', () => {
  it('should delete the created object', async () => {
    const firstUser = await request('http://localhost:3000').get('/api/users')

    request(app)
      .delete('/api/users/' + firstUser.body[0].id)
      .expect(204)

  });
});

describe('GET api/users/:userId', () => {
    it('should return 404 if the object does not exist', () => {
        request(app)
            .get('/api/users/123')
            .expect(404)
            .end((error, response) => {

                expect(response.body).toHaveProperty('message', 'Invalid user ID');

            });
    });
});

