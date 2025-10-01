
export

help: 
	@echo "Usage: make [options] [target] ..."; \
	echo "Targets:"; \
	fgrep -h '##' Makefile | awk -F'##|: ' '{printf "%40s %s\n", $$1, $$3}' | fgrep -v 'fgrep';

dump: ## dump db
	@echo "Be sure venv is active"
	@cd backend && python manage.py dumpdata --indent=4  > db.json

load: ## load db (load basic db)
	@echo "Be sure venv is active"
	@cd backend && python manage.py loaddata db.json

reset: ## reset db (flush + loaddata)
	@echo "Be sure venv is active"
	@cd backend && python manage.py flush && python manage.py loaddata db.json
