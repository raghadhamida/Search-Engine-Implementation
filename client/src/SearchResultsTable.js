import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React from 'react'

const SearchResultsTable = ({results, urlClicked}) => {
    let res = [];
    for (let i = 0; i < results.length; i++){
        console.log(results[i]);
        res.push(results[i]);
    }

    const handleLinkClick = (URL) => {
        console.log(URL + ' REQUESTED');
        urlClicked(URL);
    }
    
  return (
    <TableContainer>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Search Score</TableCell>
                    <TableCell>Page Rank</TableCell>
                    <TableCell>URL</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {res.map((r) =>
                    <TableRow key={r.title}>
                        <TableCell>{r.title}</TableCell>
                        <TableCell>{r.searchScore}</TableCell>
                        <TableCell>{r.pr}</TableCell>
                        <TableCell sx={{cursor: 'pointer'}} onClick={(e) => handleLinkClick(r.url)}>{r.url}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </TableContainer>
  )
}

export default SearchResultsTable