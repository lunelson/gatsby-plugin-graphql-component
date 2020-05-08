import { graphql, Link } from "gatsby"
import React from "react"
export const pageQuery = graphql`
  query {
    Tester
  }
`

export default props => {
  const { Tester } = props.data

  console.log(props.data)

  return (
    <>
      <Link to="/page2">Page2</Link>
      Test<br></br>
      <Tester></Tester>
    </>
  )
}