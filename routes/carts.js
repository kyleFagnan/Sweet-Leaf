/*
 * All routes for Carts are defined here
 * Since this file is loaded in server.js into api/widgets,
 *   these routes are mounted onto /widgets
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router = express.Router();

require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const resturantNumber = process.env.RESTAURANT_NUMBER;


const twilio = require('twilio')(accountSid, authToken);

const {messageCustomer, messageRestaurant, messageOrderReady } = require('./twilio')

module.exports = (db) => {
  router.get("/", (req, res) => {
    if (!req.cookies.user_id) {
      res.send("You are admin");
    }
    const user = req.cookies.user_id;
    const userId = req.cookies.user_id; //duplicate, should fix later
    const query = `
    SELECT id FROM orders
    WHERE user_id = $1 AND type='cart'
    `;
    db.query(query, [userId])
      .then(data => {
        const query = `
        SELECT orders.id as orderId, items.name, quantity, price, special_instructions, order_items.id as order_item_id FROM items
        JOIN order_items ON items.id = item_id
        JOIN orders ON orders.id = order_id
        WHERE orders.id = $1 AND orders.type='cart'
        GROUP BY orders.id, items.name, order_item_id, quantity, price
        `;
        db.query(query, [data.rows[0].id])
          .then((d) => {
            console.log(' your current cart', d.rows[0]);
            let subtotal = 0;
            for (let i = 0; i < d.rows.length; i++) {
              subtotal += (d.rows[i].price * d.rows[i].quantity) / 100;
            }
            res.render('cart', { orderItems: d.rows, user, subtotal });
          })
          .catch(err => {
            res
              .status(500)
              .json({ error: err.message });
          });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // add item:
  router.post("/", (req, res) => {
    if (!req.cookies.user_id) {
      res.send("Log in as a user first!");
    }
    const itemId = req.body.item_id;
    const quantity = req.body.quantity;
    const userId = req.cookies.user_id;

    // Get current user's cart
    const query = `
    SELECT id FROM orders
    WHERE user_id = $1 AND type='cart'
    `;
    db.query(query, [userId])
      .then(data => {
        const cartId = data.rows[0].id;
        console.log('cart id', cartId);
        // Add new item
        const query = `INSERT INTO order_items(order_id, item_id, quantity)
        VALUES($1, $2, $3)
        RETURNING *;`;
        //console.log(query + ", " + cartId + ", " + itemId + ", " + quantity);
        db.query(query, [cartId, itemId, quantity])
          .then(data => {
            console.log("new item added: ", data.rows[0]);
          })
          .catch(err => {
            res
              .status(500)
              .json({ error: err.message });
          });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  // remove item:
  router.post("/remove", (req, res) => {
    const itemId = req.body.item_id;
    const query = `
    DELETE FROM order_items
    WHERE id = $1
    `;
    db.query(query, [itemId])
      .then(data => {
        return res.redirect("/cart");
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  router.post("/place_order", (req, res) => {
    if (!req.cookies.user_id) {
      res.send("Log in as a user first!");
    }
    const instr = req.body.specialInstructions;
    const userId = req.cookies.user_id;

    // Get cart for userId
    const query = `
      SELECT id FROM orders
      WHERE user_id = $1 AND type='cart'
        `;
    db.query(query, [userId])
      .then(data => {
        // Update cart to order
        const query = `UPDATE orders SET type = 'order', special_instructions = $1
        WHERE id = $2 AND type = 'cart'`;
        const orderId = data.rows[0].id;
        db.query(query, [instr, orderId])
          .then(data => {
            //Creating a new cart
            const query = `
              INSERT INTO orders(user_id, type)
              VALUES($1, 'cart')
              RETURNING *;
              `;
            db.query(query, [userId])
              .then(data => {
                console.log("new cart created: ", data.rows[0]);

                res.redirect('confirmation/' + orderId);

                messageRestaurant(data.rows[0].id)
              })
              .catch(err => {
                res
                  .status(500)
                  .json({ error: err.message });
              });
          })
          .catch(err => {
            res
              .status(500)
              .json({ error: err.message });
          });

      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });

  });

  router.get("/confirmation/:id", (req, res) => {

    const orderId = req.params.id;
    const query = `
        SELECT * FROM orders
        WHERE id = $1
        `;
    db.query(query, [orderId])
      .then(data => {
        const completed = data.rows[0].completed;
        const completion_time = data.rows[0].completion_time
        const accepted = data.rows[0].accepted_at;
        const completionTime = data.rows[0].completion_time;
        console.log('completionTime', data.rows[0].completion_time);
        res.render('confirmation', { completed, accepted, completionTime });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });


  });

  return router;
};
