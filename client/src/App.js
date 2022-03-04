import './App.scss';
import Header from './components/Header/Header';
import SwapForm from './components/SwapForm/SwapForm';

function App() {
  return (
    <div className="App">
      <div className="page__wrapper">
        <Header />
        <div className="body__wrapper">
          <h1>Token Swap</h1>
          <SwapForm />
        </div>
        <div className="background__wrapper">
          <img className="background-img" alt="background-img" src="/background.jpg" />
        </div>
      </div>
    </div>
  );
}

export default App;
