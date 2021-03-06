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

let states = [
    {"name": "Alabama","abbreviation": "AL"},
    {"name": "Alaska","abbreviation": "AK"},
    {"name": "Arizona","abbreviation": "AZ"},
    {"name": "Arkansas","abbreviation": "AR"},
    {"name": "California","abbreviation": "CA"},
    {"name": "Colorado","abbreviation": "CO"},
    {"name": "Connecticut","abbreviation": "CT"},
    {"name": "District of Columbia", "abbreviation": "DC"},
    {"name": "Delaware","abbreviation": "DE"},
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
                        let coal_count = 0;
                        let natural_gas_count = 0;
                        let nuclear_count = 0;
                        let petroleum_count = 0;
                        let renewable_count = 0;
                        rows.forEach(row => {
                            strSoFar += "<tr class='text-center'>"
                            strSoFar += "<td>" + row.state_abbreviation + "</td>";
                            strSoFar += "<td>" + row.coal + "</td>";
                            coal_count += parseInt(row.coal);
                            strSoFar += "<td>" + row.natural_gas + "</td>";
                            natural_gas_count += parseInt(row.natural_gas);
                            strSoFar += "<td>" + row.nuclear +"</td>";
                            nuclear_count += parseInt(row.nuclear);
                            strSoFar += "<td>" + row.petroleum + "</td>";
                            petroleum_count += parseInt(row.petroleum);
                            strSoFar += "<td>" + row.renewable + "</td>";
                            renewable_count += parseInt(row.renewable);
                            strSoFar += "<td>" + (row.coal + row.natural_gas + row.petroleum + row.renewable) + "</td";
                            strSoFar += "</tr>"
                        });
                        response = response.replace('{{{US_YEAR}}}', req.params.selected_year);
                        response = response.replace('{{{YEAR}}}', req.params.selected_year); 
                        response = response.replace('{{{COAL_COUNT}}}', coal_count);
                        response = response.replace('{{{NATURAL_GAS_COUNT}}}',natural_gas_count);
                        response = response.replace('{{{NUCLEAR_COUNT}}}',nuclear_count);
                        response = response.replace('{{{PETROLEUM_COUNT}}}',petroleum_count);
                        response = response.replace('{{{RENEWABLE_COUNT}}}',renewable_count);
                        response = response.replace('{{{CONTENT HERE}}}', strSoFar);
                        res.status(200).type('html').send(response);
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
            db.all('SELECT * FROM Consumption INNER JOIN States ON Consumption.state_abbreviation = States.state_abbreviation WHERE Consumption.state_abbreviation = ? ORDER BY Consumption.year ASC', [req.params.selected_state], (err, rows) => {
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
                        let years = '[';
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
                            //strSoFar += JSON.stringify(row);
                            coalCounts += (row.coal / (row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable))*100 +', ';
                            naturalGasCounts += (row.natural_gas / (row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable))*100+', ';
                            nuclearCounts += (row.nuclear / (row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable))*100 +', ';
                            petroleumCounts += (row.petroleum / (row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable)*100) +', ';
                            renewableCounts += (row.renewable  / (row.coal + row.natural_gas + row.nuclear + row.petroleum + row.renewable))*100+', ';
                            years += row.year+', ';
                        });
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
                        years = years.slice(0, years.length-2);
                        years = years + ']';

                        let response = template.replace("{{{state}}}" , rows[0].state_name);
                        response = response.replace('{{{CHART_STATE}}}', rows[0].state_name);
                        response = response.replace('{{{STATE}}}', "\'" + rows[0].state_name + "\'");
                        response = response.replace("{{{COAL_COUNTS}}}", coalCounts);
                        response = response.replace("{{{YEARS}}}", years);
                        response = response.replace("{{{NATURAL_GAS_COUNTS}}}", naturalGasCounts);
                        response = response.replace("{{{NUCLEAR_COUNTS}}}", nuclearCounts);
                        response = response.replace("{{{PETROLEUM_COUNTS}}}", petroleumCounts);
                        response = response.replace("{{{RENEWABLE_COUNTS}}}", renewableCounts);
                        response = response.replace('{{{STATE_NAME}}}', rows[0].state_name);
                        response = response.replace('{{{STATE NAME}}}', rows[0].state_name.toLowerCase());
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
                db.all('SELECT Consumption.year, Consumption.state_abbreviation, Consumption.' + req.params.selected_energy_source + ', States.state_name FROM Consumption INNER JOIN States ON Consumption.state_abbreviation = States.state_abbreviation ORDER BY Consumption.year, Consumption.state_abbreviation ASC', (err, rows) => { 
                    if(err){
                        res.status(404).send('Error: Query Invalid.');
                    }
                    else{
                        let energy = req.params.selected_energy_source[0].toUpperCase() + req.params.selected_energy_source.substring(1);
                        energy = energy.replace("_"," ");
                        let response = template.replace('{{{ENERGY}}}', energy);
                        response = response.replace('{{{ENERGY_TYPE}}}',"\'" + energy + "\'");
                        response = response.replace('{{{ENERGY TYPE}}}',req.params.selected_energy_source);
                        response = response.replace('{{{ALT_TYPE}}}', energy);

                        let next = getNextEnergy(req.params.selected_energy_source);
                        let prev =getPrevEnergy(req.params.selected_energy_source);
                        response = response.replace('{{{PREV_ENERGY}}}',prev);
                        prev = prev.replace("_"," ");
                        response = response.replace('{{{PREV ENERGY}}}',prev[0].toUpperCase() + prev.substring(1));
                        response = response.replace('{{{NEXT_ENERGY}}}',next);
                        next = next.replace("_", " ");
                        response = response.replace('{{{NEXT ENERGY}}}',next[0].toUpperCase() + next.substring(1));

                        let strSoFar = '';
                        /*
                        each row is the data for one state at one year for the specified energy source,
                        this makes the for each loop tricky because we really want to start a new row after each year followed by the 51 
                        states' values for the specified energy source. Using a counter to keep track.
                        */

                        let stateYearData = {
                            AL: new Array(59),
                            AK: new Array(59),
                            AZ: new Array(59),
                            AR: new Array(59),
                            CA: new Array(59),
                            CO: new Array(59),
                            CT: new Array(59),
                            DE: new Array(59),
                            DC: new Array(59),
                            FL: new Array(59),
                            GA: new Array(59),
                            HI: new Array(59),
                            ID: new Array(59),
                            IL: new Array(59),
                            IN: new Array(59),
                            IA: new Array(59),
                            KS: new Array(59),
                            KY: new Array(59),
                            LA: new Array(59),
                            ME: new Array(59),
                            MD: new Array(59),
                            MA: new Array(59),
                            MI: new Array(59),
                            MN: new Array(59),
                            MS: new Array(59),
                            MO: new Array(59),
                            MT: new Array(59),
                            NE: new Array(59),
                            NV: new Array(59),
                            NH: new Array(59),
                            NJ: new Array(59),
                            NM: new Array(59),
                            NY: new Array(59),
                            NC: new Array(59),
                            ND: new Array(59),
                            OH: new Array(59),
                            OK: new Array(59),
                            OR: new Array(59),
                            PA: new Array(59),
                            RI: new Array(59),
                            SC: new Array(59),
                            SD: new Array(59),
                            TN: new Array(59),
                            TX: new Array(59),
                            UT: new Array(59),
                            VT: new Array(59),
                            VA: new Array(59),
                            WA: new Array(59),
                            WV: new Array(59),
                            WI: new Array(59),
                            WY: new Array(59) 
                        }
                        var counter = 0;
                        rows.forEach(row => { 
                            if((counter % 51) == 0){
                                strSoFar += "</tr>";
                            }
                            if((counter % 51) == 0){
                                strSoFar += "<tr class='text-center'>";
                                strSoFar += "<td>" + row.year + "</td>";
                            }
                            if(req.params.selected_energy_source == 'coal'){
                                strSoFar += "<td>" + row.coal + "</td>";
                                stateYearData[row.state_abbreviation][parseInt(row.year)-1960] = parseInt(row.coal);
                            }
                            if(req.params.selected_energy_source == 'natural_gas'){
                                strSoFar += "<td>" + row.natural_gas + "</td>";
                                stateYearData[row.state_abbreviation][parseInt(row.year)-1960] = parseInt(row.natural_gas);
                            }
                            if(req.params.selected_energy_source == 'nuclear'){
                                strSoFar += "<td>" + row.nuclear + "</td>";
                                stateYearData[row.state_abbreviation][parseInt(row.year)-1960] = parseInt(row.nuclear);
                            }
                            if(req.params.selected_energy_source == 'petroleum'){
                                strSoFar += "<td>" + row.petroleum + "</td>";
                                stateYearData[row.state_abbreviation][parseInt(row.year)-1960] = parseInt(row.petroleum);
                            }
                            if(req.params.selected_energy_source == 'renewable'){
                                strSoFar += "<td>" + row.renewable + "</td>";
                                stateYearData[row.state_abbreviation][parseInt(row.year)-1960] = parseInt(row.renewable);
                            }
                            
                            
                            counter++;
                        });

                        response = response.replace('{{{ENERGY_COUNTS}}}', JSON.stringify(stateYearData));
                        response = response.replace('{{{CONTENT HERE}}}', strSoFar);
                        response = response.replace('{{{CHART ENERGY}}}', energy);
                        res.status(200).type('html').send(response);
                    }
                });
            }
        }
    });
});



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
