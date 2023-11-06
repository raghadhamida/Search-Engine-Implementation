import { useState } from 'react';
import './App.css';
import {Box, Button, Container, FormControlLabel, Stack, Switch, TextField} from "@mui/material";
import SearchResultsTable from './SearchResultsTable';
import PageInfo from './PageInfo';

function App() {
  //Display settings
  const [showPage, setShowPage] = useState(false);

  //Keeping track of all the search values
  const [searchTerm, setSearchTerm] = useState('');
  const [limit, setLimit] = useState(10);
  const [boost, setBoost] = useState(false);
  const [dispMsg, setMsg] = useState('');
  const [pageToShow, setPageToShow] = useState('');
  const [typeOfSearch, setTypeOfSearch] = useState('fruit');

  //Handling link click
  const handleLinkClick = (pageURL) => {
    try{
      fetch(`http://localhost:3001/page?url=${pageURL}&type=${typeOfSearch}`)
      .then((res) => res.json())
      .then((page) => {
        setPageToShow(page);
        setShowPage(true);
      });
    } catch (err) {
      console.error('Error with single fruit page search: ', err);
    }
  }
  
  //Handling button clicks
  const handleFruitsClick = () => {
    setTypeOfSearch("fruit");
    handleSearch("fruit");
  }

  const handlePersonalClick = () => {
    setTypeOfSearch("personal");
    handleSearch("personal");
  }

  //Handling search (GET request)
  const handleSearch = async (t) => {
    try{
      fetch(`http://localhost:3001/search?q=${searchTerm}&boost=${boost}&limit=${limit}&type=${t}`)
      .then((res) => res.json())
      .then((data) => {
        setMsg(data);
        setShowPage(false);
      })
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
      <Box height='90%' sx={{outline: 'dashed 1px', overflow: 'auto'}} margin={1} alignContent={'center'}>
        <div>{showPage ? <PageInfo page={pageToShow} type={typeOfSearch}/> : <SearchResultsTable results={dispMsg} urlClicked={handleLinkClick}/>}</div>
      </Box>
      </Box>
    </div>
  );
}

export default App;
