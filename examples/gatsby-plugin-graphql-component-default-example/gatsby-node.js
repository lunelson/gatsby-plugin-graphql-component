const fs = require(`fs`)
const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const { registerComponent, createResolverField } = require(`gatsby-plugin-graphql-component`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const result = await graphql(
    `
      {
        allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }, limit: 1000) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}

let id = null
let drawerIDs = null;

const drawers = [
  {name: 'drawer-a', path: './src/components/drawers/drawer-a'},
  {name: 'drawer-b', path: './src/components/drawers/drawer-b'},
  {name: 'drawer-c', path: './src/components/drawers/drawer-c'},
]

const drawerComponents = {
  'drawer-a': { path: './src/components/drawers/drawer-a' },
  'drawer-b': { path: './src/components/drawers/drawer-b' },
  'drawer-c': { path: './src/components/drawers/drawer-c' },
}

exports.sourceNodes = async ({ actions }) => {
  // drawerIDs = await Promise.all(drawers.map(drawer => registerComponent({
  //   component: require.resolve(drawer.path)
  // })))
  id = await registerComponent({
    component: require.resolve(`./src/components/tester`),
  })
  return Promise.all(Object.keys(drawerComponents).map(async drawerName => {
    drawerComponents[drawerName].id = await registerComponent({
      component: require.resolve(drawerComponents[drawerName].path)
    })
  }))
}

exports.createResolvers = ({
    actions,
    cache,
    createNodeId,
    createResolvers,
    store,
    reporter, }) => {
  const resolvers = {
    Query: {
      Tester: createResolverField({
        resolve: async () => id,
      }),
    },
    MarkdownRemarkFrontmatter: {
      drawers: {
        type: ['String'],
        resolve: (source) => source.drawers.map(drawerName => drawerComponents[drawerName].id)
      },
      drawerComponents: {
        type: ['GraphQLComponent'],
        async resolve(source, args, context, info) {
          return Promise.all(source.drawers.map(async drawerName => {
            const node = await context.nodeModel.runQuery({
              query: {
                filter: {
                  id: {
                    eq: drawerComponents[drawerName].id
                  }
                }
              },
              type: `GraphQLComponentSource`,
              firstOnly: true
            })

            // if (process.env.NODE_ENV !== `production`) {
            //   const date = new Date()
            //   await fs.utimes(__filename, date, date)
            // }

            return node
              ? {
                  ___graphQLComponent: {
                    componentChunkName: node.componentChunkName,
                    componentPath: node.componentPath,
                    componentName: node.componentName
                  }
                }
              : null
          }))
        },
      }
    }
  }
  createResolvers(resolvers)
}
