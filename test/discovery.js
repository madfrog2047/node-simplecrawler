// Runs a very simple crawl on an HTTP server

/* eslint-env mocha */

var chai = require("chai");

chai.should();

describe("Crawler link discovery", function() {

    var Crawler = null,
        crawler = null,
        discover = null;

    beforeEach(function() {
        Crawler = require("../");
        crawler = new Crawler();
        discover = crawler.discoverResources.bind(crawler);
    });

    it("should discover http/s prefixed URLs in the document", function() {

        var links =
            discover("  blah blah http://google.com/ " +
                     " blah blah https://fish.com/resource blah " +
                     " //example.com");

        links.should.be.an("array");
        links.length.should.equal(2);
        links[0].should.equal("http://google.com/");
        links[1].should.equal("https://fish.com/resource");
    });

    it("should discover URLS in quoted attributes in the document", function() {

        var links =
            discover("  <a href='google.com'> " +
                     " <img src=\"http://example.com/resource with spaces.txt\"> " +
                     " url('thingo.com/test.html')");

        links.should.be.an("array");
        links.length.should.equal(4);
        links[0].should.equal("google.com");
        links[1].should.equal("http://example.com/resource%20with%20spaces.txt");
        links[2].should.equal("thingo.com/test.html");
    });

    it("should discover URLS in unquoted attributes in the document", function() {

        var links =
            discover("  <a href=google.com> " +
                     " <img src=http://example.com/resource with spaces.txt> " +
                     " url(thingo.com/test.html)");

        links.should.be.an("array");
        links.length.should.equal(3);
        links[0].should.equal("google.com");
        links[1].should.equal("http://example.com/resource");
        links[2].should.equal("thingo.com/test.html");
    });

    it("should replace all '&amp;'s with ampersands", function() {

        var links =
            discover("<a href='http://example.com/resource?with&amp;query=params&amp;and=entities'>");

        links.should.be.an("array");
        links.length.should.equal(2);
        links[0].should.equal("http://example.com/resource?with&query=params&and=entities");
        links[1].should.equal("http://example.com/resource");
    });

    it("should replace all '&#38;'s and '&#x00026;'s with ampersands", function() {

        var links =
            discover("<a href='http://example.com/resource?with&#38;query=params&#x00026;and=entities'>");

        links.should.be.an("array");
        links.length.should.equal(2);
        links[0].should.equal("http://example.com/resource?with&query=params&and=entities");
        links[1].should.equal("http://example.com/resource");
    });

    it("should ignore HTML comments with parseHTMLComments = false", function() {

        crawler.parseHTMLComments = false;

        var links =
            discover("  <!-- http://example.com/oneline_comment --> " +
                     " <a href=google.com> " +
                     " <!-- " +
                     " http://example.com/resource " +
                     " <a href=example.com> " +
                     " -->");

        links.should.be.an("array");
        links.length.should.equal(1);
        links[0].should.equal("google.com");
    });

    it("should ignore script tags with parseScriptTags = false", function() {

        crawler.parseScriptTags = false;

        var links =
            discover("  <script>var a = \"<a href='http://example.com/oneline_script'></a>\";</script> " +
                     " <a href=google.com> " +
                     " <script type='text/javascript'> " +
                     " http://example.com/resource " +
                     " <a href=example.com> " +
                     " </SCRIPT>");

        links.should.be.an("array");
        links.length.should.equal(1);
        links[0].should.equal("google.com");
    });

    it("should discover URLs legitimately ending with a quote or parenthesis", function() {

        var links =
            discover("<a href='example.com/resource?with(parentheses)'>" +
                     " <a href='example.com/resource?with\"double quotes\"'>" +
                     " <a href=\"example.com/resource?with'single quotes'\">");

        links.should.be.an("array");
        links.length.should.equal(3);
        links[0].should.equal("example.com/resource?with%28parentheses%29");
        links[1].should.equal("example.com/resource?with%22double+quotes%22");
        links[2].should.equal("example.com/resource?with%27single+quotes%27");
    });

    it("should discard 'javascript:' links except for any arguments in there passed to functions", function () {

        var links =
            discover("<a href='javascript:;'>" +
                     " <a href='javascript: void(0);'>" +
                     " <a href='javascript: goToURL(\"/page/one\")'>", {
                         url: "http://example.com/"
                     });

        links.should.be.an("array");
        links.length.should.equal(2);
        links[0].should.equal("http://example.com/");
        links[1].should.equal("http://example.com/page/one");
    });
});
