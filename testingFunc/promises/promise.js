const a = Promise.reject();
const b = Promise.reject();
const c = Promise.resolve("Found ID!");

function oneSuccess(promises) {
  return Promise.all(
    promises.map(p => {
    // Swapping reject and resolve cases
    // Promise.all() returns when there is one resolve or all rejects
      return p.then(
        val => Promise.reject(val),
        err => Promise.resolve(err)
      );
    })
  ).then(
    () => {},
    value => console.log("Value: " + value)
  );
}

oneSuccess([a, b, c]);

/*   var promise1 = Promise.reject(3);
  var promise2 = 42;
  var promise3 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 100, 'foo');
  });
  
  Promise.all([promise1, promise2, promise3])
  .then(values => console.log(values)
  .catch(error => console.log(error))); */
