require! {
  fs,
  path
}

k = -> path.join(__dirname, "#it.svg")

fs.read-file k(1), \utf-8 (err, data) ->
  throw err if err
  for i in "2478bde"
    fs.write-file k(i), data, \utf-8 ->
      throw it if it
      console.log i