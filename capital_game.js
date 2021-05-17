// This allows the Javascript code inside this block to only run when the page
// has finished loading in the browser.

$( document ).ready(function() {
  let country_capital_pairs = [];
  let res;
  let pairs = [], coords = [];
  let url = "https://cs374.s3.ap-northeast-2.amazonaws.com/country_capital_geo.csv";


  $.when($.ajax(url)).done(function(data) {
    res = data.split('\n').map(w => w.trim());
    let db = [];
    for (let i = 0; i < res.length; i++) {
      db = db.concat(res[i].split(','));
    }
    
    db = db.slice(4, db.length - 1);
    for (let i = 0; i < db.length; i += 4) {
      let pair = {}, coord = {};
      pair['country'] = db[i];
      pair['capital'] = db[i + 1];
      coord['country'] = db[i];
      coord['coordinates'] = [Number(db[i + 2]), Number(db[i + 3])];
      pairs.push(pair);
      coords.push(coord); 
    }

    window.pairs = pairs;
    window.coordinates = coords;
    country_capital_pairs = pairs;

    function findCoordinates(country) {
      return window.coordinates.find(obj => obj.country == country).coordinates;
    }     

    let submit = document.querySelector('#pr2__button');
    let country = document.querySelector('#pr2__country');
    let capital = document.querySelector('#pr2__capital');
    let table = document.querySelector('#table');
    let n = country_capital_pairs.length;
    let prevCountry = country_capital_pairs[Math.floor(Math.random() * n)]["country"];
    let dropdown = document.querySelector('#dropdown');
    let emptyList = document.querySelector('#empty_list');
    let root = firebase.database().ref();
    let clear = document.querySelector('#pr3__clear'); 
    let children; // number of children in the database        


    function changeCountry() {
      let randomCountry = country_capital_pairs[Math.floor(Math.random() * n)]["country"];
      prevCountry = country.textContent;
      while (prevCountry == randomCountry) {
        randomCountry = country_capital_pairs[Math.floor(Math.random() * n)]["country"];
      }
      country.textContent = randomCountry;
      capital.value = '';
      capital.focus();
      let coords = findCoordinates(randomCountry);
      map.setCenter(coords);
    }
    
    function emptyDatabase() {
      let query = root.orderByKey();
      query.once('value').then(function(entries) {
        entries.forEach(function(_child) {
          root.child(_child.key).remove();
        });
      });
    }
    
    function capitalOf(country) {
      return country_capital_pairs.find(pair => pair['country'] == country)['capital'];
    }

    function addRow(userInput, trueCapital, prev, afterload, Key) {
      let answerIsCorrect = userInput.trim().toLowerCase() == trueCapital.toLowerCase();
      let currentKey;

      if (!afterload) {
        let modifiedUserInput = answerIsCorrect ? trueCapital : userInput;
        obj = {
          country: prev,
          userInput: modifiedUserInput,
          capital: trueCapital,
        }
        root.push(obj);
        root.on('child_added', function(data) {
          currentKey = data.key;
        });
      } else {
        currentKey = Key;
      }

      let newRow = document.createElement('tr');
      let td1 = document.createElement('td');
      let td2 = document.createElement('td');
      let td3 = document.createElement('td');
      td1.classList.add('td1');
      td2.classList.add('td2');
      td3.classList.add('td3');
      td1.innerHTML = prev;
      td2.innerHTML = trueCapital;
      td3.innerHTML = trueCapital;
      td3.setAttribute('id', currentKey);
      newRow.appendChild(td1);
      newRow.appendChild(td2);
      newRow.appendChild(td3);

      newRow.classList.add('correct');

      if (!answerIsCorrect) {
        td2.innerHTML = userInput;
        td3.innerHTML = trueCapital;
        newRow.classList.remove('correct');
        newRow.classList.add('wrong');
      }

      td1.addEventListener('mouseover', function(event) {
        newRow.style.backgroundColor = 'lightgray';
        setTimeout(function() {
          map.setCenter(findCoordinates(event.target.textContent.trim()));
          document.querySelector('#map').style.border = '3px solid orange';
          map.setZoom(4);
        }, 500);
      });

      country.addEventListener('mouseover', function(event) {
        table.rows[1].style.backgroundColor = 'lightgray';
        setTimeout(function() {
          map.setCenter(findCoordinates(event.target.textContent.trim()));
          document.querySelector('#map').style.border = '3px solid orange';
          map.setZoom(4);
        }, 500);
      });

      td1.addEventListener('mouseout', function(event) {
        newRow.style.backgroundColor = '';
        document.querySelector('#map').style.border = '';
      });

      country.addEventListener('mouseout', function(event) {
        table.rows[1].style.backgroundColor = '';
        document.querySelector('#map').style.border = '';
      });

      td3.innerHTML += "<button class='remove'>Remove</button>";

      td3.addEventListener('mouseover', function() {
        newRow.style.backgroundColor = 'lightgray';
        setTimeout(function() {
          map.setCenter(findCoordinates(td1.textContent.trim()));
          document.querySelector('#map').style.border = '3px solid black';
          map.setZoom(6);
        }, 500);
      });

      td3.addEventListener('mouseout', function(event) {
        newRow.style.backgroundColor = '';
        document.querySelector('#map').style.border = '';

      });

      td3.childNodes.forEach(item => {
        if (item.tagName == 'BUTTON') {
          item.addEventListener('click', () => {
            if (dropdown.selectedIndex == 0) {
              if (Array.from(document.querySelectorAll('tr')).filter(row => row.classList.contains('correct') 
              || row.classList.contains('wrong')).length == 1) {
                newRow.remove();
                emptyList.style.display = 'table-row';
              } else {
                newRow.remove();
                emptyList.style.display = 'none';
              }
            } else if (dropdown.selectedIndex == 1) {
              if (Array.from(document.querySelectorAll('tr')).filter(row => row.classList.contains('correct')).length == 1) {
                newRow.remove();
                emptyList.style.display = 'table-row';
              } else {
                newRow.remove();
                emptyList.style.display = 'none';
              }
            } else {
              if (Array.from(document.querySelectorAll('tr')).filter(row => row.classList.contains('wrong')).length == 1) {
                newRow.remove();
                emptyList.style.display = 'table-row';
              } else {
                newRow.remove();
                emptyList.style.display = 'none';
              }
            }
            capital.focus();
            root.child(td3.id).remove();
          });
        }
      });

      
      if (newRow.classList.contains('correct') && dropdown.options[dropdown.selectedIndex].value == 'Wrong') {
        dropdown.selectedIndex = 0;
        document.querySelectorAll('tr').forEach(row => {
          if (row.classList.contains('correct') || row.classList.contains('wrong')) {
            row.style.display = 'table-row';
          }
        });
      } else if (newRow.classList.contains('wrong') && dropdown.options[dropdown.selectedIndex].value == 'Correct') {
        dropdown.selectedIndex = 0;
        document.querySelectorAll('tr').forEach(row => {
          if (row.classList.contains('correct') || row.classList.contains('wrong')) {
            row.style.display = 'table-row';
          }
        });
      } 
      emptyList.style.display = 'none'; 
      table.appendChild(newRow);
    }

    // this runs when the page reloads/refreshes

    let query = root.orderByKey();
    root.once('value').then(function(snapshot) {
      children = snapshot.numChildren();
    });
    query.once('value').then(function(entries) {
      entries.forEach(function(_child) {
        let obj = _child.val();
        addRow(obj.userInput, obj.capital, obj.country, true, _child.key);
      });
    });
    if (children) emptyList.style.display = 'none';
    country.textContent = prevCountry;   
    capital.value = '';
    capital.focus();
    map.setCenter(findCoordinates(prevCountry));

    ////////////////////////////////////////////////////////////////////

    $(function() {
      let capitals = country_capital_pairs.map(c => c['capital']);
      $('#pr2__capital').autocomplete({
        source: function(request, response) {
          let matches = $.map(capitals, function(item) {
              if (item.toLowerCase().indexOf(request.term.toLowerCase()) === 0) {
            return item;
          }});
          response(matches);
        },
        minLength: 2, 
        select: function(event, ui) {
          event.preventDefault();
          $(this).val(ui.item.value);
          let userInput = ui.item.value;
          let trueCapital = capitalOf(country.textContent);
          changeCountry();
          addRow(userInput, trueCapital, prevCountry, false);
        }
      });
    });



    submit.addEventListener('click', () => {
      if (capital.value.trim() != '') {
        let userInput = capital.value;
        let trueCapital = capitalOf(country.textContent);
        changeCountry();
        addRow(userInput, trueCapital, prevCountry, false);
        $('.ui-autocomplete').hide('');
      }
    });

    
    

    window.addEventListener('keyup', event => {
      if (event.key == 'Enter') submit.click();
    })

    function dropdownChange() {
      if (dropdown.options[dropdown.selectedIndex].value == 'Correct') {
        let rows = Array.from(document.querySelectorAll('tr'));

        if (!rows.some(item => item.classList.contains('correct'))) {
          emptyList.style.display = 'table-row';
        } else {
          emptyList.style.display = 'none';
        }
        
        rows.forEach(row => {
          if (row.classList.contains('wrong')) {
            row.style.display = 'none';
          } else if (row.classList.contains('correct')) {
            row.style.display = 'table-row';
          }
        });
        
    
      } else if (dropdown.options[dropdown.selectedIndex].value == 'Wrong') {
        let rows = Array.from(document.querySelectorAll('tr'));

        if (!rows.some(item => item.classList.contains('wrong'))) {
          emptyList.style.display = 'table-row';
        } else {
          emptyList.style.display = 'none';
        }
        
        rows.forEach(row => {
          if (row.classList.contains('correct')) {
            row.style.display = 'none';
          } else if (row.classList.contains('wrong')) {
            row.style.display = 'table-row';
          }
        });
        
        
      } else {
        let rows = Array.from(document.querySelectorAll('tr'));

        if (!rows.some(item => item.classList.contains('correct') || item.classList.contains('wrong'))) {
          emptyList.style.display = 'table-row';
        } else {
          emptyList.style.display = 'none';
        }

        rows.forEach(row => {
          if (row.classList.contains('correct') || row.classList.contains('wrong')) {
            row.style.display = 'table-row';
          }
        });

        
      }
    }

    $('#dropdown').change(dropdownChange);

    clear.addEventListener('click', function() {
      if (table.rows.length == 3) {
        alert('No items to clear');
      } else {
        for (let i = table.rows.length - 1; i > 2; i--) {
          table.deleteRow(i);
        }
        emptyList.style.display = 'table-row';
        emptyDatabase();
      }
    }) 

    let td1 = document.getElementsByClassName('td1');
    let td3 = document.getElementsByClassName('td3');
    /*
    console.log(td1.length);

    
    for (let i = 0; i < td1.length; i++) {
      td1[i].addEventListener('mouseover', function(event) {
        setTimeout(function() {
          map.setCenter(findCoordinates(event.target));
          map.setAttribute('border', '3px solid orange');
        }, 500);
      });
    }
    */
  });

});
