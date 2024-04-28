#!/usr/bin/env node

const { program } = require('commander')
const fs = require('fs')
const path = require('path')

program.version('0.0.1')

const makeFirstLetterLowercase = str => {
	return str.charAt(0).toUpperCase() + str.slice(1)
}

const camelToSnake = str => {
	return str.replace(/([A-Z])/g, function (match) {
		return '_' + match.toLowerCase()
	})
}
function substringBeforeFirstUppercase(str) {
	let uppercaseCount = 0

	for (let i = 0; i < str.length; i++) {
		if (str[i] === str[i].toUpperCase() && str[i] !== str[i].toLowerCase()) {
			uppercaseCount++
			if (uppercaseCount === 1) {
				return str.slice(0, i)
			}
		}
	}

	// Возвращаем всю строку, если в ней менее двух заглавных букв
	return str
}

class FileTypesContent {
	static controller(name) {
		return `
import org.springframework.web.bind.annotation.*;
import lombok.AllArgsConstructor;

@RestController
@RequestMapping("/api/v1/{}")
@AllArgsConstructor
public class ${name}Controller {

    @GetMapping
    public void get() {

    }

    @GetMapping("/{id}")
    public void getById(@PathVariable Integer id) {

    }

    @PostMapping
    public void create(@RequestBody Object createCommand) {

    }

    @PutMapping("/{id}")
    public void update(@PathVariable Integer id) {}
    
    }`
	}

	static service(name) {
		return `
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@Service
@Slf4j
@RequiredArgsConstructor
public class ${name}Service {


    public void get() {

    }


    public void getById(@PathVariable Integer id) {

    }


    public void create(@RequestBody Object createCommand) {

    }


    public void update(@PathVariable Integer id) {}
    
}`
	}

	static facade(name) {
		return `
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@Service
@Slf4j
@RequiredArgsConstructor
public class ${name} {
    private final ${name}Service ${makeFirstLetterLowercase(name)}Service;
    

    public void get() {

    }


    public void getById(@PathVariable Integer id) {

    }


    public void create(@RequestBody Object createCommand) {

    }


    public void update(@PathVariable Integer id) {}
    
    }`
	}

	static entity(name) {
		return `
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "${camelToSnake(makeFirstLetterLowercase(name))}")
public class ${name} {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
}
    `
	}

	static vo(name) {
		return `
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ${name} {
}
    `
	}

	static command(name) {
		return `
		import jakarta.persistence.*;
		import lombok.*;
		
		@Getter
		@Setter
		@ToString
		@Builder
		@NoArgsConstructor
		@AllArgsConstructor
		public class ${name}Command {
		}
			`
	}

	static query(name) {
		return `
		import jakarta.persistence.*;
		import lombok.*;
		
		@Getter
		@Setter
		@ToString
		@Builder
		@NoArgsConstructor
		@AllArgsConstructor
		public class ${name}Query {
		}
			`
	}

	static apiError() {
		return `
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    private HttpStatus status;
    private String message;
    private ApiErrorType type;
}
`
	}

	static apiErrorType() {
		return `
import com.fasterxml.jackson.annotation.JsonProperty;

public enum ApiErrorType {

    @JsonProperty("validation")
    VALIDATION,
    @JsonProperty("business")
    BUSINESS,
    @JsonProperty("system")
    SYSTEM;

    private ApiErrorType() {
    }

}`
	}

	static exceptionAdvice(name) {
		return `
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.Objects;

@Slf4j
@ControllerAdvice
public class ${name}Advice {

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler({
            DataIntegrityViolationException.class,
            InvalidDataAccessApiUsageException.class,
    })
    @ResponseBody
    public ApiError handleConstraintException(Exception exception) {
        log.error("exception caught by advice {} ", exception.getMessage());
        if (Objects.nonNull(exception.getCause())) {
            return wrapBusinessException(exception.getCause(), HttpStatus.BAD_REQUEST);
        }
        return wrapBusinessException(exception, HttpStatus.BAD_REQUEST);
    }
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler({MethodArgumentNotValidException.class})
    @ResponseBody
    public ApiError handleValidationException(MethodArgumentNotValidException exception) {
        log.error("exception caught by advice {} ", exception.getMessage());
        BindingResult bindingResult = exception.getBindingResult();
        return wrapValidException(bindingResult.getAllErrors().get(0).getDefaultMessage(), HttpStatus.BAD_REQUEST);
    }


    @ResponseStatus(HttpStatus.FORBIDDEN)
    @ExceptionHandler({
            AccessDeniedException.class
    })
    @ResponseBody
    public ApiError handleForbiddenException(Exception exception) {
        log.error("exception caught by advice {} ", exception.getMessage());
        if (Objects.nonNull(exception.getCause())) {
            return wrapBusinessException(exception.getCause(), HttpStatus.BAD_REQUEST);
        }
        return wrapBusinessException(exception, HttpStatus.BAD_REQUEST);
    }


    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler({EntityNotFoundException.class, IllegalArgumentException.class})
    @ResponseBody
    public ApiError handleConstraintException(EntityNotFoundException exception) {
        log.error("exception caught by advice {} ", exception.getMessage());
        return wrapBusinessException(exception, HttpStatus.NOT_FOUND);
    }


    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ExceptionHandler({Exception.class})
    @ResponseBody
    public ApiError handleException(Exception exception) {
        log.error("exception caught by advice {} ", exception.getMessage());
        return wrapSystemException(HttpStatus.INTERNAL_SERVER_ERROR);
    }



    private ApiError wrapBusinessException(Throwable throwable, HttpStatus status) {
        return ApiError.builder()
                .message(throwable.getMessage())
                .status(status)
                .type(ApiErrorType.BUSINESS)
                .build();
    }

    private ApiError wrapValidException(String message, HttpStatus status) {
        return ApiError.builder()
                .message(message)
                .status(status)
                .type(ApiErrorType.VALIDATION)
                .build();
    }

    private ApiError wrapSystemException(HttpStatus status) {
        return ApiError.builder()
                .status(status)
                .type(ApiErrorType.SYSTEM)
                .build();
    }
}`
	}
}

program
	.command('init')
	.description('Создает базовую структуру папок под DDD в спринг приложении')
	.action(() => {
		const directories = [
			'application',
			'domain',
			'infrastructure',
			'infrastructure/config',
			'infrastructure/config/security',
			'infrastructure/config/app',
			'infrastructure/config/jwt',
			'infrastructure/config/oauth',
			'infrastructure/repositories',
			'domain',
			'presentation',
			'presentation/web',
		]

		directories.forEach(dir => {
			fs.mkdirSync(path.join(process.cwd(), dir), { recursive: true })
		})
	})

program
	.command('create <type> <name>')
	.description(
		`
Создает конкретную сущность.
- <name> не содержит название сущности
- <type> = "service", <name> должно содержать слово Query/Command
- <type> = "facade", <name> должно содержать слово Query/Command
- <type> = "entity"
- <type> = "exception-advice>
- <type> = "vo"
- <type> = "command"
- <type> = "query"`
	)

	.action((type, name) => {
		let content = ''

		let dirPath
		let filePath

		switch (type) {
			case 'controller':
				dirPath = path.join(process.cwd(), 'presentation', 'web', name)

				name = name.charAt(0).toUpperCase() + name.slice(1)

				filePath = path.join(dirPath, `${name}Controller.java`)

				content = FileTypesContent.controller(name)
				break
			case 'service':
				dirPath = path.join(process.cwd(), 'application')

				if (name.toLowerCase().includes('query')) {
					dirPath = path.join(
						dirPath,
						'query',
						substringBeforeFirstUppercase(name),
						'service'
					)
				} else {
					dirPath = path.join(
						dirPath,
						'command',
						substringBeforeFirstUppercase(name),
						'service'
					)
				}

				name = name.charAt(0).toUpperCase() + name.slice(1)

				filePath = path.join(dirPath, `${name}.java`)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				content = FileTypesContent.service(name)
				break
			case 'facade':
				dirPath = path.join(process.cwd(), 'application')

				if (name.toLowerCase().includes('query')) {
					dirPath = path.join(
						dirPath,
						'query',
						substringBeforeFirstUppercase(name),
						'facade'
					)
				} else {
					dirPath = path.join(
						dirPath,
						'command',
						substringBeforeFirstUppercase(name),
						'facade'
					)
				}

				name = name.charAt(0).toUpperCase() + name.slice(1)

				filePath = path.join(dirPath, `${name}.java`)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				content = FileTypesContent.facade(name)
				break
			case 'entity':
				dirPath = path.join(
					process.cwd(),
					'domain',
					name.toLowerCase(),
					'entity'
				)

				filePath = path.join(dirPath, `${name}.java`)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				content = FileTypesContent.entity(name)
				break
			case 'vo':
				dirPath = path.join(process.cwd(), 'domain', name.toLowerCase(), 'vo')
				filePath = path.join(dirPath, `${name}.java`)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				content = FileTypesContent.vo(name)

				break
			case 'exception-advice':
				dirPath = path.join(
					process.cwd(),
					'presentation',
					'web',
					'ExceptionAdvice'
				)

				filePath = path.join(dirPath, `${name}.java`)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				fs.writeFileSync(
					path.join(dirPath, 'ApiError.java'),
					FileTypesContent.apiError()
				)
				fs.writeFileSync(
					path.join(dirPath, 'ApiErrorType.java'),
					FileTypesContent.apiErrorType()
				)

				content = FileTypesContent.exceptionAdvice(name)
				break
			case 'command':
				folderName = name.charAt(0).toUpperCase() + name.slice(1)
				dirPath = path.join(
					process.cwd(),
					'presentation',
					'web',
					folderName,
					'dto',
					'command'
				)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				filePath = path.join(dirPath, `${name}.java`)
				content = FileTypesContent.command(name)
				break
			case 'query':
				folderName = name.charAt(0).toUpperCase() + name.slice(1)
				dirPath = path.join(
					process.cwd(),
					'presentation',
					'web',
					folderName,
					'dto',
					'query'
				)

				if (!fs.existsSync(dirPath)) {
					fs.mkdirSync(dirPath, { recursive: true })
				}

				filePath = path.join(dirPath, `${name}.java`)
				content = FileTypesContent.query(name)
				break
			default:
				console.log('что-то пошло не так', type, name)
				break
		}

		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true })
		}

		fs.writeFileSync(filePath, content)
	})

program.parse(process.argv)
