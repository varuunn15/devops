import express from 'express';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));

// Define a simple route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});


app.get('/api/hello', (req, res) => {
    res.status(200).json({ message: 'Hello from the backend server!' });
});

app.get('/api/users', (req, res) => {
    res.status(200).json([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' }
    ]);
}
)

const PORT = 3000;  


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})