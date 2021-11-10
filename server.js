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
                        if(req.params.selected_year == '2018'){
                            response = response.replace('{{{NEXT YEAR}}}', '1960');
                            response = response.replace('{{{NEXT_YEAR}}}', '1960');
                        }
                        else{
                            response = response.replace('{{{NEXT YEAR}}}', parseInt(req.params.selected_year) + 1);
                            response = response.replace('{{{NEXT_YEAR}}}', parseInt(req.params.selected_year) + 1);
                        }

                        if(req.params.selected_year == '1960'){
                            response = response.replace('{{{PREV YEAR}}}', '2018');
                            response = response.replace('{{{PREV_YEAR}}}', '2018');
                        }
                        else{
                            response = response.replace('{{{PREV YEAR}}}', parseInt(req.params.selected_year) - 1);
                            response = response.replace('{{{PREV_YEAR}}}', parseInt(req.params.selected_year) - 1);
                        }
                        let strSoFar = '';
                        rows.forEach(row => {
                            strSoFar += "<tr class='text-center'>"
                            strSoFar += "<td>" + row.state_abbreviation + "</td>";
                            strSoFar += "<td>" + row.coal + "</td>";
                            strSoFar += "<td>" + row.natural_gas + "</td>";
                            strSoFar += "<td>" + row.nuclear +"</td>";
                            strSoFar += "<td>" + row.petroleum + "</td>";
                            strSoFar += "<td>" + row.renewable + "</td>";
                            strSoFar += "<td>" + (row.coal + row.natural_gas + row.petroleum + row.renewable) + "</td";
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
                        let coalCounts = '[';
                        let naturalGasCounts = '[';
                        let nuclearCounts ='[';
                        let petroleumCounts = '[';  
                        let renewableCounts = '[';
                        let strSoFar = '';  
                        rows.forEach(row => {
                            strSoFar += "<tr class='text-center'>";
                            strSoFar += "<td>" + row.year + "</td>";
                            strSoFar += "<td>" + row.coal + "</td>";
                            strSoFar += "<td>" + row.natural_gas + "</td>";
                            strSoFar += "<td>" + row.nuclear + "</td>";
                            strSoFar += "<td>" + row.petroleum + "</td>";
                            strSoFar += "<td>" + row.renewable + "</td>";
                            strSoFar += "<td>" + row.natural_gas + "</td>";
                            strSoFar += "<td>" + (row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable) + "</td";
                            strSoFar += "</tr>";
                            // strSoFar += JSON.stringify(row);
                            coalCounts += row.coal +', ';
                            naturalGasCounts += row.natural_gas+', ';
                            nuclearCounts += row.nuclear +', ';
                            petroleumCounts += row.petroleum +', ';
                            renewableCounts += row.renewable +', ';
                        });
                        let response = template.replace("{{{state}}}" , rows[0].state_name);
                        coalCounts = coalCounts.slice(0, coalCounts.length-2);
                        coalCounts = coalCounts + ']';
                        naturalGasCounts = naturalGasCounts.slice(0, naturalGasCounts.length-2);
                        naturalGasCounts = naturalGasCounts + ']';
                        nuclearCounts = nuclearCounts.slice(0, nuclearCounts.length-2);
                        nuclearCounts = nuclearCounts + ']';
                        petroleumCounts = petroleumCounts.slice(0, petroleumCounts.length-2);
                        petroleumCounts = petroleumCounts + ']';
                        renewableCounts = renewableCounts.slice(0, renewableCounts.length-2);
                        renewableCounts = renewableCounts + ']';
                        let response = template.replace("{{{state}}}" , rows[0].state_abbreviation);
                        response = response.replace("{{{COAL_COUNTS}}}", coalCounts);
                        response = response.replace("{{{NATURAL_GAS_COUNTS}}}", naturalGasCounts);
                        response = response.replace("{{{NUCLEAR_COUNTS}}}", nuclearCounts);
                        response = response.replace("{{{PETROLEUM_COUNTS}}}", petroleumCounts);
                        response = response.replace("{{{RENEWABLE_COUNTS}}}", renewableCounts);
                        response = response.replace('{{{CONTENT HERE}}}', strSoFar);

                        let next = getNextState(req.params.selected_state);
                        let prev = getPrevState(req.params.selected_state);
                        response = response.replace("{{{NEXT STATE}}}", next.name);
                        response = response.replace("{{{NEXT ABBR}}}", next.abbreviation);
                        response = response.replace("{{{PREV STATE}}}", prev.name);
                        response = response.replace("{{{PREV ABBR}}}", prev.abbreviation);
                        res.status(200).type('html').send(response);
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
                        let energy = req.params.selected_energy_source[0].toUpperCase() + req.params.selected_energy_source.substring(1);
                        energy = energy.replace("_"," ");
                        let response = template.replace('{{{ENERGY}}}', energy);

                        let next = getNextEnergy(req.params.selected_energy_source);
                        let prev =getPrevEnergy(req.params.selected_energy_source);
                        response = response.replace('{{{PREV_ENERGY}}}',prev);
                        prev = prev.replace("_"," ");
                        response = response.replace('{{{PREV ENERGY}}}',prev[0].toUpperCase() + prev.substring(1));
                        response = response.replace('{{{NEXT_ENERGY}}}',next);
                        next = next.replace("_", " ");
                        response = response.replace('{{{NEXT ENERGY}}}',next[0].toUpperCase() + next.substring(1));

                        let strSoFar = '';
                        rows.forEach(row => {
                            strSoFar += JSON.stringify(row);
                        });
                        res.status(200).type('html').send(response);
                    }
                });
            }
        }
    });
});

let states = [
    {"name": "Alabama","abbreviation": "AL"},
    {"name": "Alaska","abbreviation": "AK"},
    {"name": "Arizona","abbreviation": "AZ"},
    {"name": "Arkansas","abbreviation": "AR"},
    {"name": "California","abbreviation": "CA"},
    {"name": "Colorado","abbreviation": "CO"},
    {"name": "Connecticut","abbreviation": "CT"},
    {"name": "Delaware","abbreviation": "DE"},
    {"name": "District of Columbia", "abbreviation": "DC"},
    {"name": "Florida","abbreviation": "FL"},
    {"name": "Georgia","abbreviation": "GA"},
    {"name": "Hawaii","abbreviation": "HI"},
    {"name": "Idaho","abbreviation": "ID"},
    {"name": "Illinois","abbreviation": "IL"},
    {"name": "Indiana","abbreviation": "IN"},
    {"name": "Iowa","abbreviation": "IA"},
    {"name": "Kansas","abbreviation": "KS"},
    {"name": "Kentucky","abbreviation": "KY"},
    {"name": "Louisiana","abbreviation": "LA"},
    {"name": "Maine","abbreviation": "ME"},
    {"name": "Maryland","abbreviation": "MD"},
    {"name": "Massachusetts","abbreviation": "MA"},
    {"name": "Michigan","abbreviation": "MI"},
    {"name": "Minnesota","abbreviation": "MN"},
    {"name": "Mississippi","abbreviation": "MS"},
    {"name": "Missouri","abbreviation": "MO"},
    {"name": "Montana","abbreviation": "MT"},
    {"name": "Nebraska","abbreviation": "NE"},
    {"name": "Nevada","abbreviation": "NV"},
    {"name": "New Hampshire","abbreviation": "NH"},
    {"name": "New Jersey","abbreviation": "NJ"},
    {"name": "New Mexico","abbreviation": "NM"},
    {"name": "New York","abbreviation": "NY"},
    {"name": "North Carolina","abbreviation": "NC"},
    {"name": "North Dakota","abbreviation": "ND"},
    {"name": "Ohio","abbreviation": "OH"},
    {"name": "Oklahoma","abbreviation": "OK"},
    {"name": "Oregon","abbreviation": "OR"},
    {"name": "Pennsylvania","abbreviation": "PA"},
    {"name": "Rhode Island","abbreviation": "RI"},
    {"name": "South Carolina","abbreviation": "SC"},
    {"name": "South Dakota","abbreviation": "SD"},
    {"name": "Tennessee","abbreviation": "TN"},
    {"name": "Texas","abbreviation": "TX"},
    {"name": "Utah","abbreviation": "UT"},
    {"name": "Vermont","abbreviation": "VT"},
    {"name": "Virginia","abbreviation": "VA"},
    {"name": "Washington","abbreviation": "WA"},
    {"name": "West Virginia","abbreviation": "WV"},
    {"name": "Wisconsin","abbreviation": "WI"},
    {"name": "Wyoming","abbreviation": "WY"}
];

function getNextState(currState){
    for(let i = 0; i < states.length; i++){
        if(states[i].abbreviation === currState){
            if(i == states.length - 1){
                return states[0];
            }
            else{
                return states[i+1];
            }
        }
    }
    return null;
}

function getPrevState(currState){
    for(let i = 0; i < states.length; i++){
        if(states[i].abbreviation === currState){
            if(i == 0){
                return states[states.length - 1];
            }
            else{
                return states[i-1];
            }
        }
    }
    return null;
}


let energy_types = ['coal','natural_gas','nuclear','petroleum','renewable'];

function getNextEnergy(energy){
    for(let i = 0; i < energy_types.length; i++){
        if(energy_types[i] == energy){
            if(i == energy_types.length - 1){
                return energy_types[0];
            }
            else{
                return energy_types[i+1];
            }
        }
    }
    return null;
}

function getPrevEnergy(energy){
    for(let i = 0; i < energy_types.length; i++){
        if(energy_types[i] == energy){
            if(i == 0){
                return energy_types[energy_types.length-1];
            }
            else{
                return energy_types[i-1];
            }
        }
    }
    return null;
}

app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
