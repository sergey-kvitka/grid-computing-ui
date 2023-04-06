import './/styles.css';
import {useEffect, useState} from "react";
import {Button, Modal, TextField} from "@mui/material";

function App() {

    const [openPB, setOpenPB] = useState(false);

    const [result, setResult] = useState('');

    const [currentState, setCurrentState] = useState(' ');

    const [from, setFrom] = useState(-100);
    const [to, setTo] = useState(100);

    const [cells, setCells] = useState([]);

    const [matrixSize, setMatrixSize] = useState(14);

    const [matrixStyle, setMatrixStyle] = useState({});

    useEffect(() => {
        if (!from) setFrom(0);
        if (!to) setTo(0);
        if (!matrixSize) return;
        let newCells = [];
        const amount = matrixSize * matrixSize;
        for (let i = 0; i < amount; i++) {
            let x = Math.floor(Math.random() * (to - from + 1)) + from;
            newCells.push(<div>
                <input
                    id={`cell-${i}`}
                    key={`cell-${i}`} type={'number'}
                    className={'matrix-cell'}
                    value={x}/>
            </div>)
        }
        setCells(newCells);
        setMatrixStyle({
            gridTemplateRows: `repeat(${matrixSize}, 1fr)`,
            gridTemplateColumns: `repeat(${matrixSize}, 1fr)`
        })
    }, [from, to, matrixSize]);

    function start() {
        setOpenPB(true);
        let matrix = getMatrix(matrixSize);
        let size = matrixSize;
        console.log(matrix);
        console.log(size);
        fetch('http://localhost:9500/api/sendTask', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                "jsonMatrixString": JSON.stringify(matrix),
                "matrixSize": size,
            })
        }).then(async () => {
            while (true) {
                let stop = false;
                fetch('http://localhost:9500/api/getCurrentCompleteness')
                    .then(response => {
                        return response.json();
                    })
                    .then(nums => {
                        let done = nums[0];
                        let total = nums[1];
                        setCurrentState(`${done} / ${total}`);
                        if (done === total) {
                            stop = true;
                        }
                    });
                await new Promise(r => setTimeout(r, 500));
                if (stop) break;
            }
            setOpenPB(false);
            fetch('http://localhost:9500/api/getResult')
                .then(response => {
                    return response.json();
                })
                .then(res => {
                    console.log(res);
                    setResult(`Результат:\nСумма: ${res['sum']}\nМатрица: [${
                        +res['from']['i'] + 1
                    }, ${
                        +res['from']['j'] + 1
                    }] - [${
                        +res['to']['i'] + 1
                    }, ${
                        +res['to']['j'] + 1
                    }]`);
                    paintRes(res, matrixSize);
                });
        });
    }

    function paintRes(res, matrixSize) {
        for (let i = +res['from']['i']; i <= +res['to']['i']; i++) {
            for (let j = +res['from']['j']; j <= +res['to']['j']; j++) {
                // noinspection JSValidateTypes
                document.getElementById(`cell-${matrixSize * i + j}`).style = 'background: #FFFACD';
            }
        }
    }

    function getMatrix(matrixSize) {
        let res = [];
        let curr = [];
        let i = 1;
        let length = cells.length;
        for (let j = 0; j < length; j++) {
            let cell = document.getElementById(`cell-${j}`);
            curr.push(+cell.value);
            if (i === matrixSize) {
                i = 0;
                res.push([...curr]);
                curr = [];
            }
            i++;
        }
        return res;
    }

    return (<>
        <div className={'matrix-table'} style={matrixStyle}>{cells}</div>

        <div className={'right-panel'}>
            <TextField
                className={'matrix-size-input'}
                label={'Размер матрицы'}
                variant={'outlined'}
                type={'number'}
                id={'matrixSize'}
                value={matrixSize}
                onChange={event => setMatrixSize(+event.target.value)}
            />

            <h4>Диапазон</h4>
            <div className={'from-to'}>
                <TextField
                    label={'От'}
                    variant={'outlined'}
                    type={'number'}
                    id={'from'}
                    value={from}
                    onChange={event => setFrom(+event.target.value)}
                />
                <TextField
                    label={'До'}
                    variant={'outlined'}
                    type={'number'}
                    id={'to'}
                    value={to}
                    onChange={event => setTo(+event.target.value)}
                />
            </div>

            <br/>

            <Button variant={"contained"} onClick={() => start()}>Старт</Button>

            <br/>

            <p>{result}</p>
        </div>

        <Modal open={openPB}>
            <div className={'modal'}>
                <h3>{currentState}</h3>
            </div>
        </Modal>

    </>);
}

export default App;
