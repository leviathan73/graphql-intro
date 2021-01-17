/* eslint-disable no-unused-vars */
const express = require('express');
const {
	graphqlHTTP
} = require('express-graphql');
const oracledb = require('oracledb');
const {
	makeExecutableSchema
} = require("graphql-tools");
const {
	GraphQLSchema,
	GraphQLObjectType,
	GraphQLString,
	GraphQLList,
} = require('graphql');


const {
	addMocksToSchema,
	mockServer
} = require('@graphql-tools/mock');


let oracle_connection = null

const BlogType = new GraphQLObjectType({
	name: 'Blog',
	fields: {
		JOB_ID: {
			type: GraphQLString
		},
		JOB_TITLE: {
			type: GraphQLString
		}
	},
})

// eslint-disable-next-line no-unused-vars
const schema2 = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'Query',
		fields: {
			hello: {
				type: new GraphQLList(BlogType),
				description: "eerkwerwjoeiojwierowierjowr",
				args: {
					JOB_ID: {
						type: GraphQLString
					}
				},
				resolve: async (_, {
					JOB_ID
					// eslint-disable-next-line no-unused-vars
				}, context, ____) => {
					console.log(context);
					const data = await context.db.execute("SELECT * FROM JOBS WHERE JOB_ID LIKE :ID",
						[JOB_ID], {
							outFormat: oracledb.OBJECT
						})
					return data.rows;
				}
			},
		}
	})
});


// Construct a schema, using GraphQL schema language
var schema = `
  type Query {
	# nice
	hello(JOB_ID: String!): [Blog],
	blog(ID : String): Blog!
  }

  type Blog {
	JOB_ID: String,
	JOB_TITLE: String,
	MIN_SALARY: Int,
	MAX_SALARY: Int
  }
`
// The root provides a resolver function for each API endpoint
var root = {
	Query: {
		// eslint-disable-next-line no-unused-vars
		hello: async (_, {
			JOB_ID: ID
		}, {
			db
		}) => {
			const data = await db.execute("SELECT * FROM JOBS WHERE JOB_ID LIKE :ID", [ID], {
				outFormat: oracledb.OBJECT
			});
			console.log(data.rows);
			return data.rows;
		}
	}
};

// eslint-disable-next-line no-unused-vars
let exeSchema = makeExecutableSchema({
	typeDefs: schema,
	resolvers: root
});

let mockSchema = addMocksToSchema({
	schema: exeSchema
})


var app = express();

app.on("close", () => {
	console.log("Connection closed.");
	oracle_connection.close()
});

(async function () {
	oracle_connection = await oracledb.getConnection({
		user: "hr",
		password: "secret",
		connectString: "(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = localhost)(PORT = 1521))(CONNECT_DATA =(SID = xe)))"
	})

	app.use('/mock', graphqlHTTP({
		schema: exeSchema,
		graphiql: true,
		context: {
			db: oracle_connection
		}
	}));

	app.use('/graphql', graphqlHTTP({
		schema: exeSchema,
		graphiql: true,
		context: {
			db: oracle_connection
		}
	}));

	app.listen(4000);
	console.log('Running a GraphQL API server at http://localhost:4000/graphql');
})();