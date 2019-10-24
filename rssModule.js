var RSS = require('rss');

function propagate(){
  return createRSS();
  //upload();
}

function createRSS(){

  var feed = new RSS({
      title: 'Istungid ja press',
      description: 'Eesti Vabariigi parlamendi istungid ning valitsuse pressikonverentsid YouTube\'ist',
      feed_url: 'http://88.196.184.57:8080/rss',
      site_url: 'http://88.196.184.57:8080/',
/*       image_url: 'http://example.com/icon.png',
      docs: 'http://example.com/rss/docs.html',
      managingEditor: 'Dylan Greene',
      webMaster: 'Dylan Greene',
      copyright: '2013 Dylan Greene',
      language: 'en',
      categories: ['Category 1','Category 2','Category 3'],
      pubDate: 'May 20, 2012 04:00:00 GMT',
      ttl: '60', */
/*       custom_namespaces: {
        'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
      },
      custom_elements: [
        {'itunes:subtitle': 'A show about everything'},
        {'itunes:author': 'John Doe'},
        {'itunes:summary': 'All About Everything is a show about everything. Each week we dive into any subject known to man and talk about it as much as we can. Look for our podcast in the Podcasts app or in the iTunes Store'},
        {'itunes:owner': [
          {'itunes:name': 'John Doe'},
          {'itunes:email': 'john.doe@example.com'}
        ]},
        {'itunes:image': {
          _attr: {
            href: 'http://example.com/podcasts/everything/AllAboutEverything.jpg'
          }
        }},
        {'itunes:category': [
          {_attr: {
            text: 'Technology'
          }},
          {'itunes:category': {
            _attr: {
              text: 'Gadgets'
            }
          }}
        ]}
      ] */
  });

  /* loop over data and add to feed */
  feed.item({
      title:  'Istung1',
      description: 'Martin Helme',
      url: 'http://88.196.184.57:8080/file', // link to the item
      guid: 'http://88.196.184.57:8080/file', // optional - defaults to url
      /*categories: ['Category 1','Category 2','Category 3','Category 4'], // optional - array of item categories
      author: 'Guest Author', // optional - defaults to feed author property */
      //date: 'October 20, 2019', // any format that js Date can parse.
/*       lat: 33.417974, //optional latitude field for GeoRSS
      long: -111.933231, //optional longitude field for GeoRSS */
      // enclosure: {url:'...', file:'path-to-file'}, // optional enclosure
/*       custom_elements: [
        {'itunes:author': 'John Doe'},
        {'itunes:subtitle': 'A short primer on table spices'},
        {'itunes:image': {
          _attr: {
            href: 'http://example.com/podcasts/everything/AllAboutEverything/Episode1.jpg'
          }
        }},
        {'itunes:duration': '7:04'}
      ] */
  } 
  );

  feed.item({
    title:  'Istung2',
    description: 'Martin Helmer',
    url: 'http://88.196.184.57:8080/test', // link to the item
    guid: 'http://88.196.184.57:8080/test', // optional - defaults to url
  })

  // cache the xml to send to clients
  return feed.xml();
}

module.exports = {propagate: propagate};