const fs = require('fs');
const crypto = require('crypto');
const util = require('util');

const scrypt = util.promisify(crypto.scrypt);

class UsersRepository {
  constructor(filename) {
    if (!filename) {
      throw new Error('Creating repository requires a filename');
    }

    this.filename = filename;

    try {
      fs.accessSync(this.filename)
    } catch (e) {
      fs.writeFileSync(this.filename, '[]');
    }
  }

  async getAll() {
    return JSON.parse(await fs.promises.readFile(this.filename, {
      encoding: 'utf8'
    }));
  }

  async create(attributes) {
    //attributes = {email: '', password: ''}
    attributes.id = this.randomId();
    //crypt password
    const salt =crypto.randomBytes(8).toString('hex');
    const buf = await scrypt(attributes.password, salt, 64);

    const records = await this.getAll();
    const record = {
      ...attributes,
      password: `${buf.toString('hex')}.${salt}`
    };

    records.push(record);
    await this.writeAll(records);

    return record;
  }

  async comparePasswords(safepassword, suppliedpassword){
    //saved = password saved in db hash.salt
    //supplied = password from user when sign in

    const [hashed, salt] = safepassword.split('.')
    const hashedSupplied = await scrypt(suppliedpassword,salt, 64);
    return hashed === hashedSupplied.toString('hex');
  }

  async writeAll(records) {
    await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2));
  }

  randomId() {
    return crypto.randomBytes(4).toString('hex');
  }

  async getOne(id) {
    const records = await this.getAll();
    return records.find(record => {
      return record.id === id;
    })
  }

  async delete(id) {
    const records = await this.getAll();
    const filteredRecords = records.filter(record => record.id !== id);
    await this.writeAll(filteredRecords);
  }

  async update(id, attributes) {
    const records = await this.getAll();
    const record = records.find(record => record.id === id);

    if (!record) {
      throw new Error(`Record with id ${id} not found`);
    }

    Object.assign(record, attributes);

    await this.writeAll(records);
  }

  async getOneBy(filters){
    const records = await this.getAll();

    for(let record of records){
      let found = true;
      for(let key in filters){
        if(record[key]!== filters[key]){
          found = false;
        }
      }

      if(found){
        return record;
      }
    }
  }
}

module.exports = new UsersRepository('users.json');