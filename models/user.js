var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: {type: Boolean, default: false},
    cart:{
        items:[
            {
                campId:{type:mongoose.Schema.Types.ObjectId,ref:'Campground',required:true},
                days:{type:Number,required:true}
            }
        ]
    }
});

UserSchema.methods.addToCart=function(camp){
    const cartProductIndex=this.cart.items.findIndex(cp=>{
        return cp.campId.toString()===camp._id.toString();
    })
    let newDays=1;
    const updatedCartItems=[...this.cart.items];
    if(cartProductIndex>=0)
    {
        newDays=this.cart.items[cartProductIndex].days+1;
        updatedCartItems[cartProductIndex].days=newDays;
    }
    else{
        updatedCartItems.push({
            campId:camp._id,
            days:newDays
        })
    }
    const updatedCart={
        items:updatedCartItems
    };
    this.cart=updatedCart;
    return this.save();
}
UserSchema.methods.removeFromCart=function(campId){
const updatedCartItems=this.cart.items.filter(item=>{
    return item.campId.toString()!=campId.toString();
});
this.cart.items=updatedCartItems;
return this.save();
}
UserSchema.methods.clearCart=function(){
 this.cart={items:[]};
 return this.save();
}

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);