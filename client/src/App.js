import { useState } from 'react';
import './App.css';
import {Box, Button, Container, FormControlLabel, Stack, Switch, TextField} from "@mui/material";

function App() {
  //Keeping track of all the search values
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10);
  const [boost, setBoost] = useState(false);
  const [dispMsg, setMsg] = useState('');

  //Handling button clicks
  const handleFruitsClick = () => {
    handleSearch();
  }

  const handlePersonalClick = () => {
    console.log("PERSONAL SEARCH INITIATED");
  }

  //Handling search (GET request)
  const handleSearch = async () => {
    try{
      fetch(`http://localhost:3001/search?q=${searchTerm}&boost=${boost}&limit=${limit}`)
      .then((res) => res.json())
      .then((data) => setMsg(JSON.stringify(data)))
    } catch (error) {
      console.error('Error with FRUITS search: ', error);
    }
  }

  return (
    <div className="App">
      <Box className='full-screen'>
        {/*Search bar*/}
        <Container maxWidth='md'>
          <Stack direction="row" spacing={1} margin={1}>
            <FormControlLabel value="start" control={<Switch id='boost-switch' value={boost} onChange={(e) => setBoost(e.target.checked)}/>} label="Boost" labelPlacement='start' />
            <TextField id='q-bar' label='Query' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}></TextField>
            <TextField id='limit-bar' label='Limit' type="number" InputProps={{ inputProps: { min: 1, max: 50 } }} value={limit} onChange={(e) => setLimit(e.target.value)}></TextField>
            <Button variant='outlined' onClick={handleFruitsClick}>Fruits</Button>
            <Button variant='outlined' onClick={handlePersonalClick}>Personal</Button>
          </Stack>
        </Container>
        {/*Search results display*/}
      <Box height='90%' sx={{outline: 'dashed 1px', overflow: 'auto'}} margin={1}>
        <div>{dispMsg}</div>
      </Box>
      </Box>
    </div>
  );
}

export default App;
