const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const fs = require('fs')
const path = require('path')
const imageMimeTypes = ['image/jpeg', 'image/gif', 'image/png', 'image/jpg'] //image format
const multer = require('multer') //To get filename from filesytem
const uploadPath = path.join('public', Book.coverImageBasePath)
const upload = multer({
    dest: uploadPath,           //path where the image will be saved
    fileFilter: (req, file, callback) => {  //filter image types for specified format from mimetypes
        callback(null, imageMimeTypes.includes(file.mimetype)) 
    }
})


// All Books Route
router.get('/', async (req, res) => {
    let query = Book.find()
    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    if(req.query.publishedBefore!= null && req.query.publishedBefore != ''){
        query = query.lte('publishedDate', req.query.publishedBefore)
    }
    if(req.query.publishedAfter!= null && req.query.publishedAfter != ''){
        query = query.gte('publishedDate', req.query.publishedAfter)
    } 
    try{
        const books = await query.exec()
        res.render('books/index',{
            books: books,
            searchOptions: req.query
        })
        } catch(e){
        res.redirect('/')
    }  

    
    // let searchOptions = {}
    // if (req.query != null && req.query.name !== ""){
    //     searchOptions.name = new RegExp(req.query.name, 'i')
    // }
    // try{
    //     const books = await Book.find(searchOptions)
    //     res.render('books/index', {
    //         searchOptions: req.query,
    //         books: books,
    //     })
    // } catch(e){
    //     res.redirect('/')
    // }
})

// New Book Route
router.get('/new', async (req, res) => {
    // try{
    //     const authors = await Author.find({})
    //     const book = new Book()
    //     res.render('books/new', { 
    //         authors: authors,
    //         book: book
    //     })
    // } catch(e){
    //     res.redirect('/books')
    // }
    renderNewPage(res, new Book())
})

// Create Book Route
router.post('/', upload.single('cover'), async (req, res) => {      //upload just single file from frontend 'cover
    const fileName =  req.file != null ? req.file.filename : null       //if no file from frontend filename is null else filename
    const book = new Book({                                  // req.file is an object where filename is the key, and the value is name of file
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
     })
    try {
      const newBook = await book.save()
      //res.redirect(`books/${newBook.id}`)
      res.redirect('/books')
    } catch(e){
        if(book.coverImageName != null){
        removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true)
    }
 })

 async function removeBookCover(fileName) {
    fs.unlink(path.join(uploadPath, fileName), err => {
        if (err) console.err(err)
    })
}

async function renderNewPage(res, book, hasError = false) {
    try{
        const authors = await Author.find({})
        const params = {    
            authors: authors,
            book: book
        }
        if(hasError) params.errorMessage = 'Error Creating Book'
        res.render('books/new', params)
    } catch(e){
        res.redirect('/books')
    }
 }

 
  

module.exports = router