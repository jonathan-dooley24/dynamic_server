// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');
const { send } = require('process');

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'usenergy.sqlite3');

let app = express();
let port = 8000;

// Open usenergy.sqlite3 database
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

// Serve static files from 'public' directory
app.use(express.static(public_dir));


// GET request handler for home page '/' (redirect to /year/2018)
app.get('/', (req, res) => {
    res.redirect('/year/2018');
});

// GET request handler for '/year/*'   ENERGY CONSUMPTION BY YEAR
app.get('/year/:selected_year', (req, res) => {
    fs.readFile(path.join(template_dir, 'year.html'), 'utf-8', (err, template) => {
        if(err){
            res.status(404).send("File not found");
        } 
        else {
            let response = template.replace('{{{YEAR_HEADER}}}', req.params.selected_year);
            db.all('SELECT * FROM Consumption INNER JOIN States ON Consumption.state_abbreviation = States.state_abbreviation WHERE year = ?', [req.params.selected_year], (err, rows) => {
                if(err){
                    res.status(404).send("Error: Unable to gather data");
                }
                else{
                    if(rows.length ==0){
                        res.status(404).type('html').send('Error: No data for year: ' + req.params.selected_year);
                    }
                    else{
                        let strSoFar = '';
                        rows.forEach(row => {
                            strSoFar += "<tr>"
                            strSoFar += "<td>" + row.state_abbreviation + "</td>";
                            strSoFar += "<td>" + row.coal + "</td>";
                            strSoFar += "<td>" + row.natural_gas + "</td>";
                            strSoFar += "<td>" + row.petroleum + "</td>";
                            strSoFar += "<td>" + row.renewable + "</td>";
                            //strSoFar += "<td>" + row. + "</td>";

                            strSoFar += "</tr>"
                            //strSoFar += JSON.stringify(row);
                        });
                        response = response.replace('{{{CONTENT HERE}}}', strSoFar);
                        
                        
                        
                        
                        
                        res.status(200).type('html').send(response);
                        // step 1 make the html objects/stuff


                        //step 2 populate them with a loop through each year
                        //
                    }
                }
            });
        }
    });
});

// GET request handler for '/state/*' ENERGY CONSUMPTION BY STATE
app.get('/state/:selected_state', (req, res) => {
    console.log(req.params.selected_state);
    fs.readFile(path.join(template_dir, 'state.html'),'utf-8', (err, template) => {
        if(err){
            res.status(404).send("File not found");
        } 
        else {
            db.all('SELECT * FROM Consumption INNER JOIN States ON Consumption.state_abbreviation = States.state_abbreviation WHERE Consumption.state_abbreviation = ?', [req.params.selected_state], (err, rows) => {
                if(err){
                    res.status(404).send("Error: Unable to gather data");
                }
                else{
                    if(rows.length ==0){
                        res.status(404).type('html').send('Error: No data for state: ' + req.params.selected_state);
                    }
                    else{
                        let strSoFar = '';
                        rows.forEach(row => {
                            strSoFar += JSON.stringify(row);
                        });
                        res.status(200).type('html').send(strSoFar);
                    }
                }
            });
        }
        // modify `template` and send response
        // this will require a query to the SQL database
    });
});

// GET request handler for '/energy/*' ENERGY SOURCE PAGE
app.get('/energy/:selected_energy_source', (req, res) => {
    let energySources = ['coal', 'natural_gas', 'nuclear', 'petroleum', 'renewable'];
    fs.readFile(path.join(template_dir, 'energy.html'), 'utf-8', (err, template) => {
        // modify `template` and send response
        // this will require a query to the SQL database
        if(err){
            res.status(404).send('File not found');
        }
        else { 
            if(!energySources.includes(req.params.selected_energy_source)){
                res.status(404).send('Error: no energy source by name: ' + req.params.selected_energy_source);
            }
            else{
                db.all('SELECT Consumption.year, Consumption.state_abbreviation, Consumption.' + req.params.selected_energy_source + ', States.state_name FROM Consumption INNER JOIN States ON Consumption.state_abbreviation = States.state_abbreviation', (err, rows) => {
                    if(err){
                        res.status(404).send('Error: Query Invalid.');
                    }
                    else{
                        let strSoFar = '';
                        rows.forEach(row => {
                            strSoFar += JSON.stringify(row);
                        });
                        res.status(200).type('html').send(strSoFar);
                    }
                });
            }
        }
    });
});

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
