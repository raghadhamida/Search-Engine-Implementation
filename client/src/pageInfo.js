import { Container } from '@mui/material'
import React from 'react'

const pageInfo = ({page}) => {
  return (
    <Container>
        <h1>{page.title}</h1>
        <label>{page.url}</label>
        <p>{page.outGoingLinks}</p>
        <p>{page.inComingLinks}</p>
        <p>{page.content}</p>
    </Container>
  )
}

export default pageInfo