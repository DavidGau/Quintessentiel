const express = require("express");
const path = require("path")
const session = require('express-session');
const ejs = require("ejs");
const multer = require("multer");

//FOR THE FILE UPLOAD
let storage = multer.diskStorage({
    destination: function(req, file, callback){
    	console.log("isdfiusdiufisdf")
        callback(null, './public/images'); // set the destination
    },
    filename: function(req, file, callback){
    	console.log("iisdifsdifisdfidsfi");
        callback(null, Date.now() + '.jpg'); // set the file name and extension
    }
});
let upload = multer({storage: storage});




//Class imports
const QueryEngine = require("./serverSide/scripts/QueryEngine.js");
const CtrlUser = require("./serverSide/controlers/CtrlUser.js");
const CtrlProduct = require("./serverSide/controlers/CtrlProduct.js");
const CtrlRecipe = require("./serverSide/controlers/CtrlRecipe.js");

let website = express();
let app = express();

website.set('view engine', 'ejs');
app.set('view engine', 'ejs');
//For the Posts
var bodyParser = require('body-parser');
website.use(session({ secret: 'your secret', saveUninitialized: true, resave: false }));
website.use(bodyParser.json()); // support json encoded bodies
website.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
website.set("views", path.join(__dirname, './'));

app.use(session({ secret: 'your secret', saveUninitialized: true, resave: false }));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.set("views", path.join(__dirname, './'));

website.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));


//Website routes

website.get("/serum",function(req,res){
	res.render("serum.ejs")
});

website.get("/", function(req, res) {
    res.redirect("/index")
});


website.get("/index", function(req, res) {
    res.render("index.ejs");
});

website.get("/userConnection", function(req, res) {
    res.render("userConnection.ejs");
});


website.get("/userRegister", function(req, res) {
    res.render("userRegister.ejs")
});

website.get("/recoverPassword", function(req, res) {
    res.render("recoverPassword.ejs");
});


website.get("/contactus", function(req, res) {
    res.render("contactus.ejs")
});

website.get("/catalogue", function(req, res) {
    res.render("catalogue.ejs");

});

website.get("/productInfo", function(req, res) {
    res.render("productInfo.ejs");
});



//Ajax requests
website.post("/ajaxRequest/getCivilities", function(req, res) {

    let ctrlUserObj = new CtrlUser();

    ctrlUserObj.loadAllCivilities().then(function(result) {
        res.send(result);
    });

});

website.post("/ajaxRequest/userRegister", function(req, res) {
    let ctrlUserObj = new CtrlUser();

    ctrlUserObj.addUser(req.body).then(function(addedCode) {
        res.send(addedCode.toString());
    });
});

website.post("/ajaxRequest/userConnection", function(req, res) {
    let ctrlUserObj = new CtrlUser();

    ctrlUserObj.connectUser(req.body).then(function(result) {
        if (result[0]) { //The connection worked
            req.session.userId = result[1];
            req.session.isAdmin = 0;
        }

        res.send(result[0]);
    });

});

website.post("/ajaxRequest/userRecoverPassword", function(req, res) {
    let ctrlUserObj = new CtrlUser();
    ctrlUserObj.recoverPassword(req.body).then(function(state) {
        res.send(state);
    });
});

website.post("/ajaxRequest/resendRecover", function(req, res) {
    let ctrlUserObj = new CtrlUser();
    ctrlUserObj.resendCode(req.body).then(function(state) { //Sends back a code to the email related to this code
        res.send(state);
    });

});

website.post("/ajaxRequest/catalogue", function(req, res) {
    let ctrlProduct = new CtrlProduct();

    ctrlProduct.getProductCatalogue().then(function(result) {
        res.send(result);
    });

});

website.post("/ajaxRequest/catalogueSearch", function(req, res) {
    let ctrlProduct = new CtrlProduct();

    ctrlProduct.loadProductSearch(1, req.body.search).then(function(result) {
        res.send(result);
    });

});

website.post("/ajaxRequest/produitInfo", function(req, res) {
    let ctrlProduct = new CtrlProduct();

    ctrlProduct.getProductInfo(req.body.id, 1).then(function(result) {
        res.send(result);
    });

});


website.post("/ajaxRequest/sliderFeature", function(req, res) {
    let ctrlProduct = new CtrlProduct();

    ctrlProduct.getProductFeatured().then(function(result) {
        res.send(result);
    });
});

website.post("/ajaxRequest/sliderTemoignages", function(req, res) {
    let ctrlProduct = new CtrlProduct();

    ctrlProduct.getCommentsIndex(1).then(function(result) {
        res.send(result);
    });
});

website.post("/ajaxRequest/userRecovering", function(req, res) {
    let ctrlUserObj = new CtrlUser();
    ctrlUserObj.recoveringPassword(req.body).then(function(resultCode) {
        res.send(resultCode);
    });

});

website.post("/ajaxRequest/getConditions", function(req, res) {
    let ctrlUserObj = new CtrlUser();

    ctrlUserObj.loadAllConditions().then(function(conditionsList) {
            res.send(conditionsList);
        })
        .catch(function(error) {
            res.send("Impossible de charger les conditions.");
        });

});



app.post("/ajaxRequest/adminConnection", function(req, res) {
    let ctrlUserObj = new CtrlUser();

    ctrlUserObj.connectUser(req.body, true).then(function(result) {
        if (result[0]) { //The admin connection worked
            req.session.userId = result[1];
            req.session.isAdmin = 1;

            res.send(true);
        } else {
            res.send(result[0]);
        }


    });

});

app.post("/ajaxRequest/addRecipeHandler", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.addRecipe(req.body.name, req.body.desc, req.body.instru, req.body.is_custom, req.body.product, req.body.ingre).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/addRecipeHandlerIngre", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getProducts().then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/updateRecipeHandler", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.updateRecipe(req.body.id, req.body.name, req.body.desc, req.body.instru, req.body.is_custom, req.body.product, req.body.ingre).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/updateRecipeHandlerIngre", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getIngredients(req.body.id).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/updateRecipeHandlerDesc", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getDescription(req.body.id).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/manageRecipe", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getAllRecipe().then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/updateRecipeHandlerInstru", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getInstruction(req.body.id).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/updateRecipeHandlerName", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getName(req.body.id).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/updateRecipeHandlerCustom", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.getCustom(req.body.id).then(function(result) {
        res.send(result);
    });

});

app.post("/ajaxRequest/deleteRecipeHandler", function(req, res) {
    let ctrl = new CtrlRecipe();

    ctrl.deleteRecipe(req.body.id).then(function(result) {
        res.send(result);
    });

});

//Application routes
app.get("/", function(req, res) {
    res.redirect("/manageProduct");//res.redirect("/adminConnection");
});

app.get("/adminConnection", function(req, res) {
    res.render("adminConnection.ejs");
});

app.get("/manageProduct", function(req, res) {
    if (true) { //req.session.userId != undefined && req.session.isAdmin == 1
        let ctrlProduct = new CtrlProduct();

        ctrlProduct.generateAddProductTabs().then(function(modalTabs){
            res.render("manageProduct.ejs",{addProductTabs: modalTabs});
        });

    } else {
        res.redirect("/adminConnection?pleaseConnect=true");
    }
});



app.get("/manageRecipe", function(req, res) {
    if (req.session.userId != undefined && req.session.isAdmin == 1) {
        res.render("manageRecipe.ejs");
    } else {
        res.redirect("/adminConnection?pleaseConnect=true");
    }
});

app.get("/addRecipe", function(req, res) {
    if (req.session.userId != undefined && req.session.isAdmin == 1) {
        res.render("addRecipe.ejs");
    } else {
        res.redirect("/adminConnection?pleaseConnect=true");
    }
});

app.get("/updateRecipe", function(req, res) {
    if (req.session.userId != undefined && req.session.isAdmin == 1) {
        res.render("updateRecipe.ejs");
    } else {
        res.redirect("/adminConnection?pleaseConnect=true");
    }
});

app.get("/manageCategory",function(req,res){
	if(req.session.userId != undefined && req.session.isAdmin == 1)
	{
		res.render("manageCategory.ejs");	
	}
	else{
		res.redirect("/adminConnection?pleaseConnect=true");
	}
});

app.get("/modifyProduct",function(req,res){

	if(req.session.userId != undefined && req.session.isAdmin == 1)
	{
		let ctrlProduct = new CtrlProduct();
		let productId = req.query.productId;

		Promise.all([ctrlProduct.loadProductInfosById(productId),ctrlProduct.loadTagsForBoxes(productId)]).then(function(result){
			
			ctrlProduct.loadAllCategories(result[0].category).then(function(optionBox){
				res.render("modifyproduct.ejs",{availableTags: result[1][1],allCategories: optionBox,
				productName: result[0].name,productCostPrice: result[0].costPrice,productRetailPrice: result[0].retailPrice,productQty: result[0].qty,
				productWeight: result[0].dropWeightGram,attributedTags: result[1][0],textAreaDescription:result[0].description,textAreaAdvice: result[0].advice,
				chckFeatured:(result[0].isFeatured ? "checked" : ""),chckVisible:(result[0].isVisible ? "checked" : ""),isFileRequired: ""});				
			})

		})	
			
	}
	else{
		res.redirect("/adminConnection?pleaseConnect=true");
	}
});

app.post('/addProduct', upload.single('imgProduct'), function(req, res, next) {
	if(req.session.userId != undefined && req.session.isAdmin == 1)
	{
	    let imgName = req.file.filename;
	    let data = req.body;
	    data.imgName = imgName;
	    
	     let ctrlProduct = new CtrlProduct();
	     ctrlProduct.addProduct(data).then(function(result){
	     	res.send(result)
	     });
   	}
	else{
		res.redirect("/adminConnection?pleaseConnect=true");
	}
});

app.post('/updateProduct', upload.single('imgProduct'), function(req, res, next) {
	if(req.session.userId != undefined && req.session.isAdmin == 1)
	{
		let data = req.body;

		if(req.file != undefined){
			let imgName = req.file.filename;
			data.imgName = imgName;
		}
	    
	    

	    let productId = req.query.productId;
	    let ctrlProduct = new CtrlProduct();
	     ctrlProduct.updateProduct(data).then(function(result){
	     	res.send(result)

	     });
   	}
	else{
		res.redirect("/adminConnection?pleaseConnect=true");
	}
});

app.post("/ajaxRequest/getTags",function(req,res){
		let ctrlProduct = new CtrlProduct();

		ctrlProduct.loadAllTags().then(function(result){

			
			
		});
		
});


website.listen(8000);
app.listen(5000);