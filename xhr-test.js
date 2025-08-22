// Quick test using XMLHttpRequest
console.log('Testing API...');

const xhr = new XMLHttpRequest();
xhr.open('GET', 'http://localhost:4000/api/patients', true);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    console.log('Status:', xhr.status);
    console.log('Response:', xhr.responseText);
  }
};
xhr.send();
