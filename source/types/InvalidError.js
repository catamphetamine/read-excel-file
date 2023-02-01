export default class InvalidError extends Error {
  constructor(reason) {
    super('invalid')
    this.reason = reason
  }
}