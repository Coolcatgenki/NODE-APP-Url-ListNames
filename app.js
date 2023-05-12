require("dotenv").config();
const express= require("express");
const app= express();
const mongoose= require("mongoose");
const bodyPaser=require("body-parser");
const date= require(__dirname+"/date.js");
const _=require("lodash");
const PORT= process.env.PORT || 3000;

main().catch(err=>console.log(err));
async function main(){
await mongoose.connect(process.env.MONGO);
}
const toDoListSchema= new mongoose.Schema({
    task: String,
});
const toDoList= new mongoose.model("tasks", toDoListSchema);

const listSchema= new mongoose.Schema({
    name: String,
    tasks:[toDoListSchema],
})

const listModel= new mongoose.model("lists", listSchema);

const historySchema= new mongoose.Schema({
    name: String,
    history: Boolean,
});

const historyModel= new mongoose.model("history", historySchema);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyPaser.urlencoded({extended:true}));

app.get("/", async function(request, response){
const conjuntoHistorias= await historyModel.find({});
const tasks= await toDoList.find({});
if(tasks.length===0 && conjuntoHistorias.length===0 ){
    if(conjuntoHistorias.length===0){
        const history= new historyModel({
        name: "histories",
        history: false,
        })
        await history.save();
    }
    const historie= await historyModel.findOne({name: "histories"});
    if(historie.history===false){
        const newTask= new toDoList({
            task: "New list Evolution!",
        });
        await newTask.save();
        await historyModel.findOneAndUpdate({name: "histories"}, {history: true});
    }
}else{
    response.render("list", {listTitle:"Today", newItems:tasks});
}
})
app.post("/", async function(request, response){
    const listName= request.body.button;
    const task2= new toDoList({
        task: request.body.newTask,
    });
    if(listName==="Today"){
        await task2.save();
        response.redirect("/");
    }
   else{
       const founded= await listModel.findOne({name: listName});
       const task2= new toDoList({
        task: request.body.newTask,
       });
       founded.tasks.push(task2);
       await founded.save();
       response.redirect("/"+listName);
   }
})

app.post("/delete", async function(request, response){
    const actualList= request.body.listName;
    const eraseE_ID= request.body.checkbox;

    if(actualList==="Today"){
        if(eraseE_ID!=undefined){
            await toDoList.findByIdAndRemove(eraseE_ID).catch(err=>console.log(err));
            response.redirect("/");
        }
        else{
            response.redirect("/");
        }
    }else{
        await listModel.findOneAndUpdate({name: actualList}, {$pull: {tasks: {_id: eraseE_ID}}});
        response.redirect("/"+actualList);
    }
    


  })

app.get("/:customListName", async function(request, response){
    if (request.params.customListName != "favicon.ico") {
    const listName= _.capitalize(request.params.customListName);

    const newTask= new toDoList({
        task: "New list Evolution!",
    });
    const foundList= await listModel.findOne({name: listName});
    if(!foundList){
        newList= new listModel({
            name:listName,
            tasks: newTask,
          })
        await newList.save()
        response.redirect("/"+listName);
    }
    else{
    response.render("list", {listTitle: foundList.name, newItems: foundList.tasks});
    }
}  
})

app.get("/about", function(req, res){
    res.render("about");
})

app.listen(PORT, function(){
    console.log("The server is running on the port 3000");
})