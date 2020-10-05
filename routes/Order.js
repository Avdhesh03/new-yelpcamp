var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var User=require("../models/user");
var Comment = require("../models/comment");
var Order=require("../models/order");
var middleware = require("../middleware");
var geocoder = require('geocoder');
const stripe=require('stripe')('sk_test_51HUzv6EfK7M42wO2jD5L3Xh3bP5nAbDW2Q9x8tKO4U9V18pNUupZ9i61WLFE1uanFLXBU6YTSMJFo9irYp9g0O3S00UU0hBJX8')
var { isLoggedIn, checkUserCampground, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
router.post("/create-order",isLoggedIn,function(req,res){
    req.user
    .populate('cart.items.campId')
    .execPopulate()
   .then(user=>{
       console.log("**********")
       console.log(user.cart.items);
       console.log("**********")
     const products=user.cart.items.map(i=>{
       return {
          quantity:i.days,
          product:{...i.campId._doc}
       }
     });
     const order= new Order({
      user:{
        name:req.user.username,
        userId:req.user
      },
      products:products
    });
   
     return order.save();
  
    }).then(result=>{
        return  req.user.clearCart();
       console.log(result);
     
    })
    .then(()=>{
        res.redirect("/campgrounds/orders")
    })
    .catch(err=>{
      console.log(err=>{
        console.log(err);
      })
    })
  })



  router.get('/checkout',isLoggedIn,function(req,res){
  let products;
  let total=0;
    req.user
    .populate('cart.items.campId')
    .execPopulate()
   .then(user=>{
      products=user.cart.items;
      total=0;
     products.forEach(p=>{
       total+=p.days*p.campId.cost;
     })
     return stripe.checkout.sessions.create({
        payment_method_types:['card'],
        line_items:products.map(p=>{
          return {
            name:p.campId.name,
            description:p.campId.description,
            amount:p.campId.cost*100,
            currency:'usd',
            quantity:p.days

          }
        }),
        success_url:req.protocol+'://' + req.get('host') + '/order/checkout/success',
        cancel_url:req.protocol+'://' + req.get('host') + '/order/checkout/cancel'
     })
    })
    .then(session=>{
      res.render("campgrounds/checkout",{
        products:products,
        totalSum:total,
        sessionId:session.id
      })
    })
    
    
     
       
    })

   
    router.get('/checkout/success',isLoggedIn,function(req,res){
      req.user
      .populate('cart.items.campId')
      .execPopulate()
     .then(user=>{
         console.log("**********")
         console.log(user.cart.items);
         console.log("**********")
       const products=user.cart.items.map(i=>{
         return {
            quantity:i.days,
            product:{...i.campId._doc}
         }
       });
       const order= new Order({
        user:{
          name:req.user.username,
          userId:req.user
        },
        products:products
      });
     
       return order.save();
    
      }).then(result=>{
          return  req.user.clearCart();
         console.log(result);
       
      })
      .then(()=>{
          res.redirect("/campgrounds/orders")
      })
      .catch(err=>{
        console.log(err=>{
          console.log(err);
        })
      })
    })

    router.get('/checkout/cancel',isLoggedIn,function(req,res){
      let products;
      let total=0;
        req.user
        .populate('cart.items.campId')
        .execPopulate()
       .then(user=>{
          products=user.cart.items;
          total=0;
         products.forEach(p=>{
           total+=p.days*p.campId.cost;
         })
         return stripe.checkout.sessions.create({
            payment_method_types:['card'],
            line_items:products.map(p=>{
              return {
                name:p.campId.name,
                description:p.campId.description,
                amount:p.campId.price*100,
                currency:'usd',
                quantity:p.days
    
              }
            }),
            success_url:req.protocol+'://' + req.get('host') + '/order/checkout/success',
            cancel_url:req.protocol+'://' + req.get('host') + '/order/checkout/cancel'
         })
        })
        .then(session=>{
          res.render("campgrounds/checkout",{
            products:products,
            totalSum:total,
            sessionId:session.id
          })
        })
        
        
      })

module.exports = router;