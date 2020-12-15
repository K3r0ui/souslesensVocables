var Sparql_OWL = (function () {

        var self = {};

        var filterCollectionsAncestorsDepth=4
        self.ancestorsDepth = 6

        var elasticUrl = Config.serverUrl;


        self.getTopConcepts = function (sourceLabel, options, callback) {
            if(!options)
                options={}
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_url;
            self.topClass = "http://www.w3.org/2002/07/owl#Thing"
            if (Config.sources[sourceLabel].topClass)
                self.topClass = Config.sources[sourceLabel].topClass;

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "prefix owl: <http://www.w3.org/2002/07/owl#>" +
                "" +
                "select   distinct ?topConcept  ?topConceptLabel  from <" + self.graphUri + ">   where {" +
                " ?topConcept rdfs:subClassOf <" + self.topClass + ">. " +
                " OPTIONAL{?topConcept rdfs:label ?topConceptLabel.}"
            if (options.filterCollections)
                query += "?collection skos:member ?aConcept. ?aConcept rdfs:subClassOf+ ?topConcept." + Sparql_generic.setFilter("collection", options.filterCollections)


            query += "}order by ?topConceptLabel limit 1000"


            if (false && options.filterCollections) {
                var fromStr = ""
                if (self.graphUri)
                    fromStr = " FROM <" + self.graphUri + ">"


                query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
                    "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
                    "PREFIX  skos:<http://www.w3.org/2004/02/skos/core#> " +
                    " select  distinct * " + fromStr + "   WHERE { " +
                    "  ?child1 rdfs:subClassOf ?concept.   "+
                    "   ?collection skos:member* ?acollection. " + Sparql_generic.getUriFilter("collection", options.filterCollections) +
                  //  "?acollection rdf:type skos:Collection.    ?acollection skos:member/(^rdfs:subClassOf+|rdfs:subClassOf*) ?child1.  " +
                    "?acollection rdf:type skos:Collection.    ?acollection skos:member/(rdfs:subClassOf*) ?child1.  " +
                    "  " +
                    "   ?collection skos:prefLabel ?collectionLabel." +
                    "   ?acollection skos:prefLabel ?acollectionLabel." +
                    "   optional{?concept rdfs:label ?conceptLabel.}" +
                    "   ?child1 rdfs:label ?child1Label." +
                    "   ?child1 rdf:type ?child1Type."


                for (var i = 1; i < filterCollectionsAncestorsDepth; i++) {

                    query += "OPTIONAL { ?child" + (i) + " rdfs:subClassOf ?child" + (i + 1) + "." +
                        "OPTIONAL {?child" + (i + 1) + " rdfs:label  ?child" + (i + 1) + "Label.}"+
                    "OPTIONAL {?child" + (i + 1) + " rdf:type  ?child" + (i + 1) + "Type.}"

                }
                for (var i = 1; i < filterCollectionsAncestorsDepth; i++) {
                    query += "} "
                }


                query += "}order by ?concept"

            }


            // query+="  ?prop   rdf:type owl:ObjectProperty.  ?prop rdfs:domain ?topConcept.   ?prop rdfs:range ?range.  filter( not EXISTS {?topConcept rdfs:subClassOf ?d}) }limit 1000"
            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err)
                }

                result.results.bindings= Sparql_generic.setBindingsOptionalProperties(result.results.bindings,"child",{type:"http://www.w3.org/2002/07/owl#Class"})

                if(false && options.filterCollections) {
                    var newBindings=[];
                    var uniqueIds={}
                    result.results.bindings.forEach(function (item) {
                        var done=false
                        for(var i=filterCollectionsAncestorsDepth;i>1;i--){
                            var id=item["child"+i]
                            if(!done && id  && !uniqueIds[id]){
                                uniqueIds[id]=1
                                done=true;
                                newBindings.push({
                                    topConcept:{
                                        value:item["child"+i].value,
                                    },
                                    topConceptLabel:{
                                        value:item["child"+i+"Label"].value,
                                    },
                                    topConceptType:{
                                        value:item["child"+i+"Type"].value,
                                    }
                                })
                            }
                        }

                    })
                    result.results.bindings=newBindings;
                }



                return callback(null, result.results.bindings);
            })

        }


        self.getNodeChildren = function (sourceLabel, words, ids, descendantsDepth, options, callback) {
            if(!options)
                options={}

            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_url;
            var strFilter;
            if (words) {
                strFilter = Sparql_generic.setFilter("concept", null, words, options)
            } else if (ids) {
                strFilter = Sparql_generic.setFilter("concept", ids, null)
            }

            var query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +
                "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "select   distinct * from <" + self.graphUri + ">  where {" +
                "?child1   rdfs:subClassOf ?concept. " + strFilter +
                "OPTIONAL {?child1 rdfs:label ?child1Label.}"


            for (var i = 1; i < descendantsDepth; i++) {

                query += "OPTIONAL { ?child" + (i + 1) + " rdfs:subClassOf ?child" + i + "." +
                    "OPTIONAL {?child" + (i + 1) + " rdfs:label  ?child" + (i + 1) + "Label.}"

            }
            for (var i = 1; i < descendantsDepth; i++) {
                query += "} "
            }
            query += "} order by ?child1 limit 10000";


            if (options.filterCollections) {
                var fromStr = ""
                if (self.graphUri)
                    fromStr = " FROM <" + self.graphUri + ">"


                query = " PREFIX  rdfs:<http://www.w3.org/2000/01/rdf-schema#> " +
                    "PREFIX  rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
                    "PREFIX  skos:<http://www.w3.org/2004/02/skos/core#> " +
                    " select  distinct * " + fromStr + "   WHERE { " +
                    "  ?child1 rdfs:subClassOf ?concept.   " + strFilter +
                    "   ?collection skos:member* ?acollection. " + Sparql_generic.getUriFilter("collection", options.filterCollections) +
                 //"?acollection rdf:type skos:Collection.    ?acollection skos:member/(^rdfs:subClassOf+|rdfs:subClassOf*) ?child1.  " +
                 "?acollection rdf:type skos:Collection.    ?acollection skos:member/(rdfs:subClassOf*) ?child1.  " +
                    "  " +
                    "   ?collection skos:prefLabel ?collectionLabel." +
                    "   ?acollection skos:prefLabel ?acollectionLabel." +
                    "   optional{?concept rdfs:label ?conceptLabel.}" +
                    "   ?child1 rdfs:label ?child1Label." +
                    "   ?child1 rdf:type ?child1Type." +
                    "}order by ?concept"
            }


            var url = self.sparql_url + "?format=json&query=";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                result.results.bindings = Sparql_generic.setBindingsOptionalProperties(result.results.bindings, "child")
                return callback(null, result.results.bindings)

            })

        }

        self.getNodeInfos = function (sourceLabel, conceptId, options, callback) {
            if(!options)
                options={}
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_url;

            var query = "select *  from <" + self.graphUri + "> " +
                " where {<" + conceptId + "> ?prop ?value. } limit 500";
            self.execute_GET_query(query, function (err, result) {
                if (err) {
                    return callback(err);
                }
                return callback(null, result.results.bindings)


            })
        }
        self.getNodeParents = function (sourceLabel, words, ids, ancestorsDepth, options, callback) {
            self.graphUri = Config.sources[sourceLabel].graphUri;
            self.sparql_url = Config.sources[sourceLabel].sparql_url;
            if (!options)
                options = {}
            var strFilter;
            if (words) {
                strFilter = Sparql_generic.setFilter("concept", null, words, options)
            } else if (ids) {
                strFilter = Sparql_generic.setFilter("concept", ids, null)
            }
            var query = "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
                "PREFIX  rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>" +

                " select distinct *  from <" + self.graphUri + ">   WHERE {{"

            query += "?concept rdfs:label ?conceptLabel. " + strFilter;


            ancestorsDepth = self.ancestorsDepth
            for (var i = 1; i <= ancestorsDepth; i++) {
                if (i == 1) {
                    query += "  ?concept rdfs:subClassOf  ?broader" + i + "." +
                        "OPTIONAL{?broader" + (i) + " rdfs:label ?broader" + (i) + "Label.}"


                } else {

                    query += "OPTIONAL { ?broader" + (i - 1) + " rdfs:subClassOf ?broader" + i + "."


                    query += "OPTIONAL{?broader" + (i) + " rdfs:label ?broader" + (i) + "Label.}"

                }


            }


            for (var i = 1; i < ancestorsDepth; i++) {
                query += "} "

            }

            query += "  }";

            if (options.filterCollections) {
                query += "MINUS {?collection skos:member* ?aCollection.?acollection skos:member ?broader" + getUriFilter("collection", options.filterCollections)
            }
            query += "}limit 1000 ";


            var url = self.sparql_url + "?format=json&query=";
            Sparql_proxy.querySPARQL_GET_proxy(url, query, "", null, function (err, result) {
                if (err) {
                    return callback(err)
                }
                result.results.bindings = Sparql_generic.setBindingsOptionalProperties(result.results.bindings, "broader")
                return callback(null, result.results.bindings)

            })
        }


        self.execute_GET_query = function (query, callback) {
            var query2 = encodeURIComponent(query);
            query2 = query2.replace(/%2B/g, "+").trim()

            var url = self.sparql_url + "?output=json&query=" + query2;

            var body = {
                headers: {
                    "Accept": "application/sparql-results+json",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": self.graphUri,
                }
            }
            var payload = {
                httpProxy: 1,
                url: url,
                body: body,
                options: {a: 1},
                GET: true


            }
            $("#waitImg").css("display", "block");
            $.ajax({
                type: "POST",
                url: elasticUrl,
                data: payload,
                dataType: "json",
                /* beforeSend: function(request) {
                     request.setRequestHeader('Age', '10000');
                 },*/

                success: function (data, textStatus, jqXHR) {
                    if (data.result && typeof data.result != "object")//cas GEMET
                        data = JSON.parse(data.result)
                    //  $("#messageDiv").html("found : " + data.results.bindings.length);

                    /*  if (data.results.bindings.length == 0)
                          return callback({data.results.bindings:},[])*/
                    callback(null, data)

                }
                , error: function (err) {
                    $("#messageDiv").html(err.responseText);

                    $("#waitImg").css("display", "none");
                    console.log(JSON.stringify(err))
                    console.log(JSON.stringify(query))
                    if (callback) {
                        return callback(err)
                    }
                    return (err);
                }

            });
        }


        return self;


    }
)()
